import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const queryProductsSchema = z.object({
  cursor: z.string().optional().describe('Cursor for pagination (id)'),
  limit: z.coerce.number().int().min(1).max(100).optional().describe('Items per page'),
  categoryId: z.string().uuid().optional().describe('Filter by category ID'),
  minPrice: z.coerce.number().int().min(0).optional().describe('Minimum price in minor units'),
  maxPrice: z.coerce.number().int().min(0).optional().describe('Maximum price in minor units'),
  inStock: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional()
    .describe('Filter to only show in-stock items'),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest']).optional().describe('Sort order'),
});

export class QueryProductsDto extends createZodDto(queryProductsSchema) {}
