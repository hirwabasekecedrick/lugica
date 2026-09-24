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
}
