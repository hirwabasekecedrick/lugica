import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1').describe('New quantity'),
});

export class UpdateCartItemDto extends createZodDto(updateCartItemSchema) {}
