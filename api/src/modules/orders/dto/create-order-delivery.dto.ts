import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createOrderDeliverySchema = z.object({
  pickupAddress: z.string().min(1, 'pickupAddress is required').describe('Address where the package will be picked up'),
  pickupLat: z.number().min(-90).max(90).describe('Latitude of pickup location'),
  pickupLng: z.number().min(-180).max(180).describe('Longitude of pickup location'),
  packageDetails: z.string().optional().describe('Description of the package contents and dimensions'),
});

export class CreateOrderDeliveryDto extends createZodDto(createOrderDeliverySchema) {}
