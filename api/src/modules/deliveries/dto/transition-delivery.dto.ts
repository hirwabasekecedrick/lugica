import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const transitionDeliverySchema = z.object({
  notes: z
    .string()
    .max(500)
    .optional()
    .describe('Optional notes about this status change'),
});

export class TransitionDeliveryDto extends createZodDto(
  transitionDeliverySchema,
) {}
