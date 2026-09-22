import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createDeliverySchema = z.object({
  pickupAddress: z.string().min(1, 'pickupAddress is required').describe('Address where the package will be picked up'),
  pickupLat: z.number().min(-90).max(90).describe('Latitude of pickup location'),
  pickupLng: z.number().min(-180).max(180).describe('Longitude of pickup location'),
  dropoffAddress: z.string().min(1, 'dropoffAddress is required').describe('Address where the package will be delivered'),
  dropoffLat: z.number().min(-90).max(90).describe('Latitude of dropoff location'),
  dropoffLng: z.number().min(-180).max(180).describe('Longitude of dropoff location'),
  packageDetails: z.string().min(1, 'packageDetails is required').describe('Description of the package contents and dimensions'),
  clientId: z.string().uuid('clientId must be a valid UUID').describe('UUID of the client requesting the delivery'),
});

export class CreateDeliveryDto extends createZodDto(createDeliverySchema) {}
