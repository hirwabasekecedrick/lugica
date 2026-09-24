import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { VehicleOwnership, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { AssignDriverDto } from './dto/assign-driver.dto.js';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVehicleDto) {
    // Ownership type / ownedByDriverId consistency check
    if (
      dto.ownershipType === VehicleOwnership.INDIVIDUAL &&
      !dto.ownedByDriverId
    ) {
      throw new BadRequestException(
        'ownedByDriverId is required when ownershipType is INDIVIDUAL',
      );
    }

    if (
      dto.ownershipType === VehicleOwnership.COMPANY &&
      dto.ownedByDriverId
    ) {
      throw new BadRequestException(
        'ownedByDriverId must not be set when ownershipType is COMPANY',
      );
    }

    // If INDIVIDUAL, verify the owner is actually a DRIVER
    if (dto.ownedByDriverId) {
      const owner = await this.prisma.user.findUnique({
        where: { id: dto.ownedByDriverId },
        select: { role: true },
      });

      if (!owner || owner.role !== Role.DRIVER) {
        throw new BadRequestException(
          'ownedByDriverId must reference a user with DRIVER role',
        );
      }
    }

    // Check plate number uniqueness
    const existing = await this.prisma.vehicle.findUnique({
      where: { plateNumber: dto.plateNumber },
    });

    if (existing) {
      throw new BadRequestException('A vehicle with this plate number already exists');
    }

    return this.prisma.vehicle.create({
      data: {
        plateNumber: dto.plateNumber,
        type: dto.type,
        capacity: dto.capacity,
        ownershipType: dto.ownershipType,
        ownedByDriverId: dto.ownedByDriverId ?? null,
      },
    });
  }

  async findAll() {
    return this.prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        ownedByDriver: {
          select: { id: true, name: true, email: true },
        },
        assignedDriver: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findById(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        ownedByDriver: {
          select: { id: true, name: true, email: true },
        },
        assignedDriver: {
          select: { id: true, name: true, email: true },
        },
        assignments: {
          orderBy: { assignedAt: 'desc' },
          take: 10,
          include: {
            driver: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  async assignDriver(vehicleId: string, dto: AssignDriverDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    // Verify the driver exists and has DRIVER role
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

    // Atomic transaction: close prior assignment, open new one, update vehicle
    return this.prisma.$transaction(async (tx) => {
      // Close prior assignment (set unassignedAt) if one exists
      if (vehicle.assignedDriverId) {
        await tx.vehicleAssignment.updateMany({
          where: {
            vehicleId,
            unassignedAt: null,
          },
          data: {
            unassignedAt: new Date(),
          },
        });
      }

      // Create new assignment record
      await tx.vehicleAssignment.create({
        data: {
          vehicleId,
          driverId: dto.driverId,
        },
      });

      // Update vehicle's assigned driver
      const updatedVehicle = await tx.vehicle.update({
        where: { id: vehicleId },
        data: { assignedDriverId: dto.driverId },
        include: {
          assignedDriver: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return updatedVehicle;
    });
  }
}
