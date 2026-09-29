import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { VehicleOwnership } from '@prisma/client';

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required').describe('License plate number of the vehicle'),
  type: z.string().min(1, 'Type is required').describe('Type of the vehicle (e.g., Truck, Van, Motorcycle)'),
  capacity: z.number().positive('Capacity must be a positive number').describe('Capacity in kilograms'),
  ownershipType: z.nativeEnum(VehicleOwnership).describe('Ownership type of the vehicle'),
  ownedByDriverId: z.string().uuid().optional().describe('UUID of the driver who owns this vehicle (if individual)'),
});

export class CreateVehicleDto extends createZodDto(createVehicleSchema) {}
