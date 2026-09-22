import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Role } from '@prisma/client';

export const queryUsersSchema = z.object({
  page: z.coerce.number().int().min(1).optional().describe('Page number'),
  limit: z.coerce.number().int().min(1).max(100).optional().describe('Items per page'),
  role: z.nativeEnum(Role).optional().describe('Filter by role'),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional()
    .describe('Filter by active status'),
  search: z.string().optional().describe('Search term for email, name, or phone'),
});

export class QueryUsersDto extends createZodDto(queryUsersSchema) {}
