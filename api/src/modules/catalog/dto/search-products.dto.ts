import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const searchProductsSchema = z.object({
  q: z.string().min(1, 'Search query cannot be empty').describe('Search string'),
  cursor: z.string().optional().describe('Cursor for pagination (id)'),
  limit: z.coerce.number().int().min(1).max(100).optional().describe('Items per page'),
});

export class SearchProductsDto extends createZodDto(searchProductsSchema) {}
