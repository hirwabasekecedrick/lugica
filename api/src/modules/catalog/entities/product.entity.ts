import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { ProductImageEntity } from './product-image.entity.js';

export class ProductEntity {
  @ApiProperty({ description: 'Product ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Stock Keeping Unit' })
  sku: string;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Product description' })
  description: string;

  @ApiProperty({ description: 'Category ID' })
  categoryId: string;

  @ApiProperty({ description: 'Price in minor units (e.g. cents)', example: 1000 })
  priceMinorUnits: number;

  @ApiProperty({ description: 'Currency code', example: 'RWF' })
  currency: string;

  @ApiProperty({ description: 'Current stock quantity', example: 50 })
  stockQuantity: number;

  @ApiProperty({ description: 'Product status', enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: [ProductImageEntity], description: 'Product images' })
  images?: ProductImageEntity[];
}
