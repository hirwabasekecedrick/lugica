import { Injectable, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { LocationsService } from '../locations/locations.service.js';

/** TTL for the per-driver live-state key in Redis (seconds). */
const DRIVER_STATE_TTL_SECONDS = 120;

/** Redis key prefix for individual driver tracking state. */
const DRIVER_STATE_PREFIX = 'tracking:driver:';

/** Redis key for the set of active driver IDs. */
const ACTIVE_DRIVERS_SET = 'tracking:active_drivers';

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

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly locationsService: LocationsService,
  ) {}

  // ─── Driver State Management ──────────────────────────────────────────────

  /**
   * Mark a driver as actively tracking (they opened the app / started a shift).
   * Writes their live state to Redis and adds them to the active-drivers set.
   */
  async startTracking(driverId: string): Promise<DriverLiveState> {
    const driver = await this.prisma.user.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        assignedVehicles: {
          where: { status: 'ACTIVE' },
          select: { plateNumber: true },
          take: 1,
        },
      },
    });

    if (!driver || driver.role !== Role.DRIVER) {
      throw new Error('User is not a driver');
    }

    if (!driver.isActive) {
      throw new Error('Driver account is deactivated');
    }

    const state: DriverLiveState = {
      driverId: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      vehiclePlateNumber:
        driver.assignedVehicles[0]?.plateNumber ?? null,
      activeDeliveryId: null,
      trackingStatus: 'available',
      lastLatitude: null,
      lastLongitude: null,
      lastAccuracy: null,
      lastSeenAt: new Date().toISOString(),
      trackingStartedAt: new Date().toISOString(),
    };

    await this.writeDriverState(driverId, state);
    this.logger.log(`Driver ${driver.name} (${driverId}) started tracking`);
    return state;
  }

  /**
   * Mark a driver as no longer tracking (closed the app / ended shift).
   */
  async stopTracking(driverId: string): Promise<void> {
    await this.redis.del(`${DRIVER_STATE_PREFIX}${driverId}`);
    await this.redis.clientInstance.srem(ACTIVE_DRIVERS_SET, driverId);
    this.logger.log(`Driver ${driverId} stopped tracking`);
  }

  /**
   * Process an incoming location update from a driver.
   * - Updates the live state in Redis
   * - Persists the location to Postgres + Redis via LocationsService
   */
  async handleLocationUpdate(
    driverId: string,
    latitude: number,
    longitude: number,
    accuracy: number | null,
    deliveryId: string | null,
  ): Promise<DriverLiveState | null> {
    // Persist location via the existing locations service
    await this.locationsService.ping(driverId, {
      latitude,
      longitude,
      accuracy: accuracy ?? undefined,
      deliveryId: deliveryId ?? undefined,
    });

    // Update live state in Redis
    const existing = await this.getDriverState(driverId);

    if (!existing) {
      // Driver hasn't called startTracking — auto-bootstrap their state
      const state = await this.startTracking(driverId);
      state.lastLatitude = latitude;
      state.lastLongitude = longitude;
      state.lastAccuracy = accuracy;
      state.lastSeenAt = new Date().toISOString();
      state.activeDeliveryId = deliveryId;
      if (deliveryId) {
        state.trackingStatus = 'on_delivery';
      }
      await this.writeDriverState(driverId, state);
      return state;
    }

    existing.lastLatitude = latitude;
    existing.lastLongitude = longitude;
    existing.lastAccuracy = accuracy;
    existing.lastSeenAt = new Date().toISOString();
    if (deliveryId) {
      existing.activeDeliveryId = deliveryId;
      existing.trackingStatus = 'on_delivery';
    }
    await this.writeDriverState(driverId, existing);
    return existing;
  }

  // ─── Read Operations ──────────────────────────────────────────────────────

  /**
   * Return the live state for a single driver.
   */
  async getDriverState(
    driverId: string,
  ): Promise<DriverLiveState | null> {
    return this.redis.get<DriverLiveState>(
      `${DRIVER_STATE_PREFIX}${driverId}`,
    );
  }

  /**
   * Return the live state for ALL currently-active drivers.
   * Used by admin clients for the dispatch map.
   */
  async getAllActiveDrivers(): Promise<DriverLiveState[]> {
    const driverIds = await this.redis.clientInstance.smembers(
      ACTIVE_DRIVERS_SET,
    );

    if (!driverIds.length) {
      return [];
    }

    const pipeline = this.redis.clientInstance.pipeline();
    for (const id of driverIds) {
      pipeline.get(`${DRIVER_STATE_PREFIX}${id}`);
    }
    const results = await pipeline.exec();

    const drivers: DriverLiveState[] = [];
    if (results) {
      for (const [err, val] of results) {
        if (!err && typeof val === 'string') {
          try {
            drivers.push(JSON.parse(val) as DriverLiveState);
          } catch {
            // skip corrupt entries
          }
        }
      }
    }
    return drivers;
  }

  /**
   * Return the GPS trail for a specific delivery (all location points
   * recorded while the driver had this deliveryId active).
   */
  async getDeliveryTrail(deliveryId: string) {
    return this.prisma.driverLocation.findMany({
      where: { deliveryId },
      orderBy: { recordedAt: 'asc' },
      select: {
        latitude: true,
        longitude: true,
        accuracy: true,
        recordedAt: true,
      },
    });
  }

  /**
   * Role-aware wrapper around getDeliveryTrail.
   * Admin: any delivery. Driver: only assigned. Client: only their own.
   */
  async getDeliveryTrailForUser(
    deliveryId: string,
    currentUser: { sub: string; role: Role },
  ) {
    if (currentUser.role !== Role.ADMIN) {
      const delivery = await this.prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: { clientId: true, driverId: true },
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      if (
        currentUser.role === Role.CLIENT &&
        delivery.clientId !== currentUser.sub
      ) {
        throw new Error('Access denied to this delivery');
      }

      if (
        currentUser.role === Role.DRIVER &&
        delivery.driverId !== currentUser.sub
      ) {
        throw new Error('Access denied to this delivery');
      }
    }

    return this.getDeliveryTrail(deliveryId);
  }

  // ─── Internal Helpers ─────────────────────────────────────────────────────

  private async writeDriverState(
    driverId: string,
    state: DriverLiveState,
  ): Promise<void> {
    await this.redis.setWithTTL(
      `${DRIVER_STATE_PREFIX}${driverId}`,
      state,
      DRIVER_STATE_TTL_SECONDS,
    );
    await this.redis.clientInstance.sadd(ACTIVE_DRIVERS_SET, driverId);
  }
}
