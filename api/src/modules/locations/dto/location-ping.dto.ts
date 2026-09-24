import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const locationPingSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'latitude must not be less than -90')
    .max(90, 'latitude must not be greater than 90')
    .describe('Current latitude of the vehicle (-90 to 90)'),
  longitude: z
    .number()
    .min(-180, 'longitude must not be less than -180')
    .max(180, 'longitude must not be greater than 180')
    .describe('Current longitude of the vehicle (-180 to 180)'),
  accuracy: z.number().optional().describe('Accuracy of the location in meters'),
  deliveryId: z.string().uuid().optional().describe('UUID of the active delivery if any'),
});

export class LocationPingDto extends createZodDto(locationPingSchema) {}
