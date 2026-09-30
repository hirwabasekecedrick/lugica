import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DeliveryStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateDeliveryDto } from './dto/create-delivery.dto.js';
import { AssignDeliveryDto } from './dto/assign-delivery.dto.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class DeliveriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDeliveryDto, currentUser: JwtPayload) {
    return this.prisma.delivery.create({
      data: {
        clientId: currentUser.sub,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffAddress: dto.dropoffAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        packageDetails: dto.packageDetails,
        status: DeliveryStatus.PENDING,
      },
    });
  }

  async findAll(currentUser: JwtPayload) {
    // Role-aware filtering:
    // - ADMIN: sees all deliveries
    // - CLIENT: sees only their own deliveries
    // - DRIVER: sees only deliveries assigned to them
    let where: Record<string, unknown> = {};

    switch (currentUser.role) {
      case Role.ADMIN:
        // No filter — admin sees all
        break;
      case Role.CLIENT:
        where = { clientId: currentUser.sub };
        break;
      case Role.DRIVER:
        where = { driverId: currentUser.sub };
        break;
    }

    return this.prisma.delivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        driver: {
          select: { id: true, name: true, email: true },
        },
        vehicle: {
          select: { id: true, plateNumber: true, type: true },
        },
      },
    });
  }

  async findById(id: string, currentUser: JwtPayload) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        driver: {
          select: { id: true, name: true, email: true },
        },
        vehicle: {
          select: { id: true, plateNumber: true, type: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }

    // Role-aware access check
    if (currentUser.role === Role.CLIENT && delivery.clientId !== currentUser.sub) {
      throw new ForbiddenException('You can only view your own deliveries');
    }

    if (currentUser.role === Role.DRIVER && delivery.driverId !== currentUser.sub) {
      throw new ForbiddenException('You can only view deliveries assigned to you');
    }

    return delivery;
  }

  async assign(
    deliveryId: string,
    dto: AssignDeliveryDto,
    currentUser: JwtPayload,
  ) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${deliveryId} not found`);
    }

    if (delivery.status !== DeliveryStatus.PENDING) {
      throw new BadRequestException(
        `Cannot assign delivery: current status is ${delivery.status}, expected PENDING`,
      );
    }

    // Verify driver exists and has DRIVER role
    const driver = await this.prisma.user.findUnique({
      where: { id: dto.driverId },
      select: { id: true, role: true, isActive: true },
    });

    if (!driver || driver.role !== Role.DRIVER) {
      throw new BadRequestException(
        'driverId must reference a user with DRIVER role',
      );
    }

    if (!driver.isActive) {
      throw new BadRequestException('Cannot assign an inactive driver');
    }

    // Verify vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
      select: { id: true, status: true },
    });

    if (!vehicle) {
      throw new BadRequestException('Vehicle not found');
    }

    if (vehicle.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Vehicle status is ${vehicle.status}, expected ACTIVE`,
      );
    }

    // Atomic transaction: set driver/vehicle, transition PENDING→ASSIGNED, write history
    return this.prisma.$transaction(async (tx) => {
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          driverId: dto.driverId,
          vehicleId: dto.vehicleId,
          status: DeliveryStatus.ASSIGNED,
        },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          driver: {
            select: { id: true, name: true, email: true },
          },
          vehicle: {
            select: { id: true, plateNumber: true, type: true },
          },
        },
      });

      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId,
          fromStatus: DeliveryStatus.PENDING,
          toStatus: DeliveryStatus.ASSIGNED,
          changedByUserId: currentUser.sub,
          notes: `Assigned driver ${dto.driverId} with vehicle ${dto.vehicleId}`,
        },
      });

      return updatedDelivery;
    });
  }

  // ─── Status Transitions ───────────────────────────────────────────────────

  /** Valid transitions: fromStatus → toStatus[] */
  private static readonly TRANSITIONS: Record<
    DeliveryStatus,
    DeliveryStatus[]
  > = {
    [DeliveryStatus.PENDING]: [
      DeliveryStatus.ASSIGNED,
      DeliveryStatus.CANCELLED,
    ],
    [DeliveryStatus.ASSIGNED]: [
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.CANCELLED,
    ],
    [DeliveryStatus.PICKED_UP]: [
      DeliveryStatus.IN_TRANSIT,
      DeliveryStatus.CANCELLED,
    ],
    [DeliveryStatus.IN_TRANSIT]: [
      DeliveryStatus.DELIVERED,
      DeliveryStatus.FAILED,
    ],
    [DeliveryStatus.DELIVERED]: [],
    [DeliveryStatus.CANCELLED]: [],
    [DeliveryStatus.FAILED]: [],
  };

  /**
   * Transition a delivery to a new status with full validation.
   * Returns the updated delivery with relations.
   */
  async transitionStatus(
    deliveryId: string,
    toStatus: DeliveryStatus,
    currentUser: JwtPayload,
    notes?: string,
  ) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: {
        id: true,
        status: true,
        clientId: true,
        driverId: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException(
        `Delivery with ID ${deliveryId} not found`,
      );
    }

    // Validate the transition is allowed
    const allowed =
      DeliveriesService.TRANSITIONS[delivery.status] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${delivery.status} to ${toStatus}`,
      );
    }

    // Role-based checks for specific transitions
    this.enforceTransitionPermissions(
      delivery,
      toStatus,
      currentUser,
    );

    return this.prisma.$transaction(async (tx) => {
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: toStatus,
          ...(toStatus === DeliveryStatus.DELIVERED
            ? { deliveredAt: new Date() }
            : {}),
        },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          driver: {
            select: { id: true, name: true, email: true },
          },
          vehicle: {
            select: { id: true, plateNumber: true, type: true },
          },
        },
      });

      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId,
          fromStatus: delivery.status,
          toStatus,
          changedByUserId: currentUser.sub,
          notes: notes ?? null,
        },
      });

      return updatedDelivery;
    });
  }

  /** Convenience: ASSIGNED → PICKED_UP (driver only) */
  async pickup(
    deliveryId: string,
    currentUser: JwtPayload,
    notes?: string,
  ) {
    return this.transitionStatus(
      deliveryId,
      DeliveryStatus.PICKED_UP,
      currentUser,
      notes,
    );
  }

  /** Convenience: PICKED_UP → IN_TRANSIT (driver only) */
  async startTransit(
    deliveryId: string,
    currentUser: JwtPayload,
    notes?: string,
  ) {
    return this.transitionStatus(
      deliveryId,
      DeliveryStatus.IN_TRANSIT,
      currentUser,
      notes,
    );
  }

  /** Convenience: IN_TRANSIT → DELIVERED (driver only) */
  async deliver(
    deliveryId: string,
    currentUser: JwtPayload,
    notes?: string,
  ) {
    return this.transitionStatus(
      deliveryId,
      DeliveryStatus.DELIVERED,
      currentUser,
      notes,
    );
  }

  /** Convenience: any cancelable state → CANCELLED (admin or client) */
  async cancel(
    deliveryId: string,
    currentUser: JwtPayload,
    notes?: string,
  ) {
    return this.transitionStatus(
      deliveryId,
      DeliveryStatus.CANCELLED,
      currentUser,
      notes,
    );
  }

  /** Convenience: IN_TRANSIT → FAILED (driver or admin) */
  async fail(
    deliveryId: string,
    currentUser: JwtPayload,
    notes?: string,
  ) {
    return this.transitionStatus(
      deliveryId,
      DeliveryStatus.FAILED,
      currentUser,
      notes,
    );
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private enforceTransitionPermissions(
    delivery: {
      id: string;
      status: DeliveryStatus;
      clientId: string;
      driverId: string | null;
    },
    toStatus: DeliveryStatus,
    currentUser: JwtPayload,
  ): void {
    // Admin can do everything
    if (currentUser.role === Role.ADMIN) {
      return;
    }

    // Driver transitions: PICKED_UP, IN_TRANSIT, DELIVERED, FAILED
    const driverTransitions: DeliveryStatus[] = [
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.IN_TRANSIT,
      DeliveryStatus.DELIVERED,
      DeliveryStatus.FAILED,
    ];

    if (driverTransitions.includes(toStatus)) {
      if (currentUser.role !== Role.DRIVER) {
        throw new ForbiddenException(
          'Only the assigned driver or an admin can perform this transition',
        );
      }
      if (delivery.driverId !== currentUser.sub) {
        throw new ForbiddenException(
          'You can only update deliveries assigned to you',
        );
      }
      return;
    }

    // CANCELLED: admin or owning client
    if (toStatus === DeliveryStatus.CANCELLED) {
      if (
        currentUser.role === Role.CLIENT &&
        delivery.clientId === currentUser.sub
      ) {
        return;
      }
      throw new ForbiddenException(
        'Only the owning client or an admin can cancel a delivery',
      );
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}
