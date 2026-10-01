import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Role, DeliveryStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LocationsService } from '../locations/locations.service.js';
import {
  DriverLiveStateStore,
  type DriverLiveState,
} from './driver-live-state.store.js';

export type { DriverLiveState };

/** Default trail sample size when the client does not ask for a specific one. */
const DEFAULT_MAX_TRAIL_POINTS = 500;

/** Hard ceiling, so a caller cannot request an unbounded response. */
const MAX_TRAIL_POINTS_CEILING = 5000;

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly store: DriverLiveStateStore,
    private readonly locationsService: LocationsService,
  ) {}

  // ─── Driver State Management ─────────────────────────────────────────────

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

    const now = new Date().toISOString();
    const state: DriverLiveState = {
      driverId: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      vehiclePlateNumber: driver.assignedVehicles[0]?.plateNumber ?? null,
      activeDeliveryId: null,
      trackingStatus: 'available',
      lastLatitude: null,
      lastLongitude: null,
      lastAccuracy: null,
      lastSeenAt: now,
      trackingStartedAt: now,
    };

    await this.store.write(state);
    this.logger.log(`Driver ${driver.name} (${driverId}) started tracking`);
    return state;
  }

  /** Mark a driver as no longer tracking (closed the app / ended shift). */
  async stopTracking(driverId: string): Promise<void> {
    await this.store.remove(driverId);
    this.logger.log(`Driver ${driverId} stopped tracking`);
  }

  /**
   * Process an incoming location update from a driver over the socket.
   *
   * Delegates persistence to `LocationsService.ping`, which also maintains the
   * live-state key — so the socket and REST paths cannot drift apart again.
   */
  async handleLocationUpdate(
    driverId: string,
    latitude: number,
    longitude: number,
    accuracy: number | null,
    deliveryId: string | null,
  ): Promise<DriverLiveState | null> {
    await this.locationsService.ping(driverId, {
      latitude,
      longitude,
      accuracy: accuracy ?? undefined,
      deliveryId: deliveryId ?? undefined,
    });

    return this.store.read(driverId);
  }

  // ─── Read Operations ─────────────────────────────────────────────────────

  /** Return the live state for a single driver. */
  async getDriverState(driverId: string): Promise<DriverLiveState | null> {
    return this.store.read(driverId);
  }

  /** Return the live state of every currently-active driver (admin dispatch map). */
  async getAllActiveDrivers(): Promise<DriverLiveState[]> {
    return this.store.readAll();
  }

  /**
   * GPS trail for a delivery, oldest first.
   *
   * `maxPoints` bounds the payload. At the 3s transmission interval a long urban
   * delivery accrues well over a thousand rows, and every consumer that
   * refetched the full trail would pay for all of them. Sampling is a uniform
   * stride rather than the first N, so the path keeps its overall shape instead
   * of collapsing onto the trip's opening leg.
   *
   * The stride is applied in SQL via `row_number` because sampling in the
   * application would mean one indexed query per output point.
   */
  async getDeliveryTrail(
    deliveryId: string,
    options: { maxPoints?: number; since?: Date } = {},
  ) {
    const maxPoints = Math.min(
      Math.max(options.maxPoints ?? DEFAULT_MAX_TRAIL_POINTS, 2),
      MAX_TRAIL_POINTS_CEILING,
    );

    return this.prisma.$queryRaw<TrailRow[]>(Prisma.sql`
      SELECT "latitude", "longitude", "accuracy", "recordedAt", "cumulativeDistanceMeters"
      FROM (
        SELECT
          "latitude", "longitude", "accuracy", "recordedAt", "cumulativeDistanceMeters",
          row_number() OVER (ORDER BY "recordedAt" ASC) AS rn,
          count(*)     OVER ()                            AS total
        FROM "driver_locations"
        WHERE "deliveryId" = ${deliveryId}
          AND (${options.since ?? null}::timestamptz IS NULL OR "recordedAt" > ${options.since ?? null})
      ) AS sampled
      WHERE rn % GREATEST(1, FLOOR(total::numeric / ${maxPoints})::int) = 0
      ORDER BY rn ASC
    `);
  }

  /** Role-aware wrapper around getDeliveryTrail. */
  async getDeliveryTrailForUser(
    deliveryId: string,
    currentUser: { sub: string; role: Role },
    options: { maxPoints?: number; since?: Date } = {},
  ) {
    await this.assertDeliveryAccess(deliveryId, currentUser);
    return this.getDeliveryTrail(deliveryId, options);
  }

  // ─── Trip metrics ────────────────────────────────────────────────────────

  /**
   * Distance and elapsed time for a delivery.
   *
   * Distance prefers the exact Redis accumulator (written on every ping) and
   * falls back to the periodically-persisted column, so an in-flight trip
   * reports the live figure while a completed one reports the final one.
   *
   * Elapsed is derived from `DeliveryStatusHistory` rather than stored twice:
   * the clock starts at PICKED_UP — the moment the driver physically takes the
   * goods — and stops at the first terminal status. Deriving it means the two
   * can never disagree.
   */
  async getDeliverySummary(
    deliveryId: string,
    currentUser: { sub: string; role: Role },
  ) {
    await this.assertDeliveryAccess(deliveryId, currentUser);

    const [delivery, leg, history, pointCount] = await Promise.all([
      this.prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: { status: true, distanceMeters: true },
      }),
      this.store.readLeg(deliveryId),
      this.prisma.deliveryStatusHistory.findMany({
        where: { deliveryId },
        orderBy: { createdAt: 'asc' },
        select: { toStatus: true, createdAt: true },
      }),
      this.prisma.driverLocation.count({ where: { deliveryId } }),
    ]);

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const distanceMeters = leg
      ? leg.cumulativeMeters
      : delivery.distanceMeters;

    const pickedUpAt =
      history.find((h) => h.toStatus === DeliveryStatus.PICKED_UP)?.createdAt ??
      null;

    const terminalAt = history.find((h) =>
      TERMINAL_STATUSES.includes(h.toStatus),
    )?.createdAt;

    const status: DeliveryStatus = delivery.status;
    const isTerminal = TERMINAL_STATUSES.includes(status);

    // An in-flight trip keeps counting until a terminal transition is recorded.
    const elapsedSeconds =
      pickedUpAt && (isTerminal ? terminalAt : new Date())
        ? Math.max(
            0,
            Math.round(
              ((isTerminal ? terminalAt! : new Date()).getTime() -
                pickedUpAt.getTime()) /
                1000,
            ),
          )
        : 0;

    return {
      deliveryId,
      status,
      distanceMeters: Math.round(distanceMeters),
      distanceKilometers: Math.round((distanceMeters / 1000) * 100) / 100,
      pickedUpAt,
      terminalAt,
      elapsedSeconds,
      isTerminal,
      pointCount,
    };
  }

  /**
   * Authorise access to one delivery's tracking data.
   *
   * Extracted because the same check has three callers (trail, summary, and the
   * gateway's `delivery:watch` room join) and must not diverge between them.
   */
  async assertDeliveryAccess(
    deliveryId: string,
    currentUser: { sub: string; role: Role },
  ): Promise<{ clientId: string; driverId: string | null; status: DeliveryStatus }> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: { clientId: true, driverId: true, status: true },
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    if (currentUser.role !== Role.ADMIN) {
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

    return delivery;
  }
}

/** Statuses after which a trip stops accruing distance and elapsed time. */
const TERMINAL_STATUSES: readonly DeliveryStatus[] = [
  DeliveryStatus.DELIVERED,
  DeliveryStatus.FAILED,
  DeliveryStatus.CANCELLED,
];

/** Row shape returned by the raw trail query. */
type TrailRow = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recordedAt: Date;
  cumulativeDistanceMeters: number;
};