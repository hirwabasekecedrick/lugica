import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * Query options for the GPS trail endpoint.
 *
 * Exists because at the 3s transmission interval the raw trail for one delivery
 * reaches four figures within an hour, and every watching client refetches it.
 */
export const trailQuerySchema = z.object({
  maxPoints: z.coerce
    .number()
    .int()
    .min(2)
    .max(5000)
    .optional()
    .describe(
      'Maximum number of points to return. The trail is uniformly sampled down to this count. Defaults to 500.',
    ),
  // Declared as an ISO-8601 string, not `z.coerce.date()`: the Swagger
  // metadata generator renders these schemas to JSON Schema, which has no Date
  // type and throws "Date cannot be represented in JSON Schema" — taking the
  // whole API down at boot. The controller converts to a Date at the boundary.
  since: z.iso
    .datetime({ offset: true })
    .optional()
    .describe(
      'Return only points recorded after this ISO-8601 timestamp. Lets a client append new points without refetching the whole trail.',
    ),
});

export class TrailQueryDto extends createZodDto(trailQuerySchema) {}