import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const addCartItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID').describe('ID of the product'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').describe('Quantity to add'),
});

export class AddCartItemDto extends createZodDto(addCartItemSchema) {}
