import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const addWishlistItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID').describe('ID of the product'),
});

export class AddWishlistItemDto extends createZodDto(addWishlistItemSchema) {}
