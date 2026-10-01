import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';

/**
 * The single Redis representation of "where is each driver right now".
 *
 * This module exists because two subsystems used to write driver positions under
 * different key namespaces and only one was ever read, so a driver who only
 * REST-pinged was invisible on the admin live map (docs/API-GAPS.md #21):
 *
 *   | Writer                          | Keys                                                  | Read by                    |
 *   |---------------------------------|-------------------------------------------------------|----------------------------|
 *   | POST /locations/ping            | driver:location:{id} (TTL 60s)                         | nothing                    |
 *   | socket tracking:start / ping    | tracking:driver:{id} (TTL 120s) + active_drivers set  | GET /tracking/drivers      |
 *
 * Both paths now write here, with one TTL, so `POST /locations/ping` is
 * authoritative — it is the only transport available to a client that cannot
 * hold a websocket open.
 *
 * Extracted as its own module (rather than calling `TrackingService` from
 * `LocationsService`) so the dependency is one-directional: Locations and
 * Tracking both depend on the store, never on each other.
 */

/** TTL for the per-driver live-state key (seconds). */
export const DRIVER_STATE_TTL_SECONDS = 120;

/** Redis key prefix for individual driver tracking state. */
export const DRIVER_STATE_PREFIX = 'tracking:driver:';

/** Redis key for the set of active driver IDs. */
export const ACTIVE_DRIVERS_SET = 'tracking:active_drivers';

/**
 * Shape of the real-time driver state stored in Redis.
 * This is what admin clients receive via the `driversUpdate` WebSocket event
 * and via `GET /tracking/drivers`.
 */
export interface DriverLiveState {
  driverId: string;
  name: string;
  email: string;
  phone: string | null;
  vehiclePlateNumber: string | null;
  /** The delivery currently being tracked, if any. */
  activeDeliveryId: string | null;
  /** Current status: 'available' | 'on_delivery' | 'offline' */
  trackingStatus: 'available' | 'on_delivery' | 'offline';
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastAccuracy: number | null;
  lastSeenAt: string | null;
  /** ISO timestamp when the driver started tracking. */
  trackingStartedAt: string | null;
}

/** Per-delivery leg accumulator used to derive distance without a full scan. */
export interface DeliveryLegState {
  deliveryId: string;
  lastLatitude: number;
  lastLongitude: number;
  lastRecordedAt: string;
  /** Running total in metres for the whole delivery. */
  cumulativeMeters: number;
}

export function driverStateKey(driverId: string): string {
  return `${DRIVER_STATE_PREFIX}${driverId}`;
}

export function deliveryLegKey(deliveryId: string): string {
  return `tracking:leg:${deliveryId}`;
}

@Injectable()
export class DriverLiveStateStore {
  constructor(private readonly redis: RedisService) {}

  /** Write live state and (re)register the driver in the active set. */
  async write(state: DriverLiveState): Promise<void> {
    await this.redis.setWithTTL(
      driverStateKey(state.driverId),
      state,
      DRIVER_STATE_TTL_SECONDS,
    );
    await this.redis.clientInstance.sadd(ACTIVE_DRIVERS_SET, state.driverId);
  }

  /** Remove live state and deregister the driver. */
  async remove(driverId: string): Promise<void> {
    await this.redis.del(driverStateKey(driverId));
    await this.redis.clientInstance.srem(ACTIVE_DRIVERS_SET, driverId);
  }

  async read(driverId: string): Promise<DriverLiveState | null> {
    return this.redis.get<DriverLiveState>(driverStateKey(driverId));
  }

  /**
   * Read every registered driver's state in one round trip.
   *
   * Uses a pipeline rather than N sequential GETs: the active set can hold every
   * driver on shift, and a ping storm would otherwise serialise one RTT per
   * driver on the admin broadcast path.
   */
  async readAll(): Promise<DriverLiveState[]> {
    const driverIds = await this.redis.clientInstance.smembers(
      ACTIVE_DRIVERS_SET,
    );
    if (!driverIds.length) return [];

    const pipeline = this.redis.clientInstance.pipeline();
    for (const id of driverIds) {
      pipeline.get(driverStateKey(id));
    }
    const results = await pipeline.exec();

    const drivers: DriverLiveState[] = [];
    if (results) {
      for (const [err, val] of results) {
        if (err || typeof val !== 'string') continue;
        try {
          drivers.push(JSON.parse(val) as DriverLiveState);
        } catch {
          // A corrupt entry is skipped rather than failing the whole read: one
          // bad value must not blank the admin map for every other driver.
        }
      }
    }
    return drivers;
  }

  // ─── Per-delivery leg accumulator ─────────────────────────────────────────

  async readLeg(deliveryId: string): Promise<DeliveryLegState | null> {
    return this.redis.get<DeliveryLegState>(deliveryLegKey(deliveryId));
  }

  async writeLeg(state: DeliveryLegState): Promise<void> {
    await this.redis.setWithTTL(
      deliveryLegKey(state.deliveryId),
      state,
      DRIVER_STATE_TTL_SECONDS,
    );
  }

  async clearLeg(deliveryId: string): Promise<void> {
    await this.redis.del(deliveryLegKey(deliveryId));
  }
}