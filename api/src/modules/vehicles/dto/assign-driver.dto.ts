import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const assignDriverSchema = z.object({
  driverId: z.string().uuid('driverId must be a valid UUID').describe('UUID of the driver to assign'),
});

export class AssignDriverDto extends createZodDto(assignDriverSchema) {}
