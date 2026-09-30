import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ProductStatus } from '@prisma/client';

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required').describe('Stock Keeping Unit (unique)'),
  name: z.string().min(1, 'Name is required').describe('Product name'),
  description: z.string().min(1, 'Description is required').describe('Product description'),
  categoryId: z.string().uuid('Invalid category ID').describe('ID of the category'),
  priceMinorUnits: z.number().int().min(0, 'Price cannot be negative').describe('Price in minor units (e.g. cents)'),
  currency: z.string().default('RWF').describe('Currency code'),
  minStockThreshold: z.number().int().min(0).default(10).describe('Minimum stock threshold'),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE).describe('Product status'),
  images: z
    .array(
      z.object({
        url: z.string().url('Invalid image URL'),
        altText: z.string().optional(),
        sortOrder: z.number().int().default(0),
      }),
    )
    .optional()
    .describe('Product images'),
});

export class CreateProductDto extends createZodDto(createProductSchema) {}
