import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { LocationPingDto } from './dto/location-ping.dto.js';
import { DriverLiveStateStore } from '../tracking/driver-live-state.store.js';
import { distanceMeters, isPlausibleLeg } from '../../common/geo/haversine.js';

/**
 * Per-delivery distance accumulator, held in Redis.
 *
 * Kept here rather than in the store module because it is specific to how
 * locations accumulate into a trip; the store only owns key/TTL mechanics.
 */
interface LegState {
  lastLatitude: number;
  lastLongitude: number;
  lastRecordedAt: string;
  cumulativeMeters: number;
}

/**
 * How often to push the running total onto `deliveries.distance_meters`.
 *
 * At a 3s ping interval that is ~20 writes/min/driver straight onto a row that
 * delivery status transitions also write, so the durable copy is updated less
 * often than it is accumulated. The in-flight total lives in Redis, and a final
 * write is forced when a trip reaches a terminal state.
 */
const DELIVERY_DISTANCE_WRITE_INTERVAL_MS = 15_000;

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly store: DriverLiveStateStore,
  ) {}

  /**
   * Record one position.
   *
   * Writes three things, in this order:
   *  1. the per-delivery leg accumulator in Redis (authoritative while driving),
   *  2. the immutable `DriverLocation` trail row, carrying the cumulative total,
   *  3. the driver live state the admin map reads.
   *
   * (3) is why this service can write `tracking:driver:{id}`. It used to write
   * a `driver:location:{id}` key that nothing read, so a driver who only ever
   * REST-pinged never appeared on the admin map (docs/API-GAPS.md #21).
   */
  async ping(driverId: string, dto: LocationPingDto) {
    const recordedAt = new Date();
    const deliveryId = dto.deliveryId ?? null;

    const leg = deliveryId
      ? await this.nextLeg(deliveryId, {
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracy: dto.accuracy ?? null,
          recordedAt,
        })
      : null;

    const driverLocation = await this.prisma.driverLocation.create({
      data: {
        driverId,
        deliveryId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy ?? null,
        recordedAt,
        legDistanceMeters: leg?.legMeters ?? 0,
        cumulativeDistanceMeters: leg?.cumulativeMeters ?? 0,
      },
    });

    // Durable running total, written on a slower cadence than it is computed.
    if (deliveryId && leg) {
      await this.persistDeliveryDistance(deliveryId, leg.cumulativeMeters);
    }

    await this.touchDriverState(driverId, {
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy ?? null,
      deliveryId,
      recordedAt,
    });

    this.logger.debug(
      `Location ping from driver ${driverId}: lat=${dto.latitude}, lng=${dto.longitude}`,
    );

    return {
      id: driverLocation.id,
      recordedAt: driverLocation.recordedAt,
      /** Distance covered so far on this delivery, in metres. */
      cumulativeDistanceMeters: leg?.cumulativeMeters ?? 0,
    };
  }

  /**
   * Advance the per-delivery accumulator by one leg.
   *
   * Seeds from the last stored row when the Redis key is missing (Redis restart,
   * eviction, or the first ping of a delivery), so a mid-trip Redis loss
   * under-reports by at most one leg rather than resetting the trip to zero.
   */
  private async nextLeg(
    deliveryId: string,
    fix: {
      latitude: number;
      longitude: number;
      accuracy: number | null;
      recordedAt: Date;
    },
  ): Promise<{ legMeters: number; cumulativeMeters: number }> {
    const previous =
      (await this.store.readLeg(deliveryId)) ??
      (await this.lastStoredPoint(deliveryId));

    let legMeters = 0;
    let cumulativeMeters = previous?.cumulativeMeters ?? 0;

    if (previous) {
      const plausible = isPlausibleLeg(
        {
          latitude: previous.lastLatitude,
          longitude: previous.lastLongitude,
          recordedAt: previous.lastRecordedAt,
        },
        {
          latitude: fix.latitude,
          longitude: fix.longitude,
          recordedAt: fix.recordedAt,
        },
        fix.accuracy,
      );

      if (plausible) {
        legMeters = distanceMeters(
          {
            latitude: previous.lastLatitude,
            longitude: previous.lastLongitude,
          },
          { latitude: fix.latitude, longitude: fix.longitude },
        );
        cumulativeMeters += legMeters;
      }
    }

    await this.store.writeLeg({
      deliveryId,
      lastLatitude: fix.latitude,
      lastLongitude: fix.longitude,
      lastRecordedAt: fix.recordedAt.toISOString(),
      cumulativeMeters,
    });

    return { legMeters, cumulativeMeters };
  }

  /** Last persisted point for a delivery, used to re-seed the leg accumulator. */
  private async lastStoredPoint(deliveryId: string): Promise<LegState | null> {
    const row = await this.prisma.driverLocation.findFirst({
      where: { deliveryId },
      orderBy: { recordedAt: 'desc' },
      select: {
        latitude: true,
        longitude: true,
        recordedAt: true,
        cumulativeDistanceMeters: true,
      },
    });

    if (!row) return null;

    return {
      lastLatitude: row.latitude,
      lastLongitude: row.longitude,
      lastRecordedAt: row.recordedAt.toISOString(),
      cumulativeMeters: row.cumulativeDistanceMeters,
    };
  }

  /**
   * Copy the Redis total onto `deliveries.distance_meters`, rate-limited.
   *
   * Skip is optimistic: if the stored value already equals the new total, there
   * is nothing to write, which is the common case while parked.
   */
  private async persistDeliveryDistance(
    deliveryId: string,
    cumulativeMeters: number,
  ): Promise<void> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: { distanceMeters: true, updatedAt: true },
    });

    if (!delivery) return;
    if (Math.abs(delivery.distanceMeters - cumulativeMeters) < 1) return;

    const sinceLastWrite = Date.now() - delivery.updatedAt.getTime();
    if (sinceLastWrite < DELIVERY_DISTANCE_WRITE_INTERVAL_MS) {
      return;
    }

    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { distanceMeters: cumulativeMeters },
    });
  }

  /**
   * Refresh the driver's live state without requiring `tracking:start` first.
   *
   * Bootstraps a driver who is not yet registered, so the REST path is enough to
   * become visible on the admin map. Mirrors the socket path's behaviour.
   */
  private async touchDriverState(
    driverId: string,
    fix: {
      latitude: number;
      longitude: number;
      accuracy: number | null;
      deliveryId: string | null;
      recordedAt: Date;
    },
  ): Promise<void> {
    const existing = await this.store.read(driverId);

    if (!existing) {
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

      if (!driver || driver.role !== 'DRIVER') return;

      // A deactivated driver must not stay visible on the live map. The socket
      // path throws for this; here the ping is simply dropped.
      if (!driver.isActive) return;

      await this.store.write({
        driverId: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        vehiclePlateNumber: driver.assignedVehicles[0]?.plateNumber ?? null,
        activeDeliveryId: fix.deliveryId,
        trackingStatus: fix.deliveryId ? 'on_delivery' : 'available',
        lastLatitude: fix.latitude,
        lastLongitude: fix.longitude,
        lastAccuracy: fix.accuracy,
        lastSeenAt: fix.recordedAt.toISOString(),
        trackingStartedAt: fix.recordedAt.toISOString(),
      });
      return;
    }

    existing.lastLatitude = fix.latitude;
    existing.lastLongitude = fix.longitude;
    existing.lastAccuracy = fix.accuracy;
    existing.lastSeenAt = fix.recordedAt.toISOString();

    if (fix.deliveryId) {
      existing.activeDeliveryId = fix.deliveryId;
      existing.trackingStatus = 'on_delivery';
    }

    await this.store.write(existing);
  }

  /**
   * Finalise a trip: flush the exact Redis total and release the accumulator.
   *
   * Called on a terminal delivery transition so the stored distance is exact
   * rather than up to one write interval stale.
   */
  async finaliseDelivery(deliveryId: string): Promise<void> {
    const leg = await this.store.readLeg(deliveryId);
    if (leg) {
      await this.prisma.delivery.update({
        where: { id: deliveryId },
        data: { distanceMeters: leg.cumulativeMeters },
      });
    }
    await this.store.clearLeg(deliveryId);
  }

  /** Release the accumulator without a distance write (cancelled/failed trips). */
  async releaseLeg(deliveryId: string): Promise<void> {
    await this.store.clearLeg(deliveryId);
  }
}