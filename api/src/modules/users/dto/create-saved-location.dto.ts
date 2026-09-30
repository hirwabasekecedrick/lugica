import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createSavedLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export class CreateSavedLocationDto extends createZodDto(createSavedLocationSchema) {}
