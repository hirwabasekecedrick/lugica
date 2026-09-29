import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { OrderStatus } from '@prisma/client';

export const queryOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).optional().describe('Page number'),
  limit: z.coerce.number().int().min(1).max(100).optional().describe('Items per page'),
  status: z.nativeEnum(OrderStatus).optional().describe('Filter by order status'),
});

export class QueryOrdersDto extends createZodDto(queryOrdersSchema) {}
