import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const assignDeliverySchema = z.object({
  driverId: z.string().uuid('driverId must be a valid UUID').describe('UUID of the driver being assigned'),
  vehicleId: z.string().uuid('vehicleId must be a valid UUID').describe('UUID of the vehicle being used'),
});

export class AssignDeliveryDto extends createZodDto(assignDeliverySchema) {}
