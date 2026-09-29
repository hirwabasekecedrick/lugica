import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductImageEntity {
  @ApiProperty({ description: 'Image ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Associated product ID' })
  productId: string;

  @ApiProperty({ description: 'Image URL' })
  url: string;

  @ApiPropertyOptional({ description: 'Alternative text for the image' })
  altText: string | null;

  @ApiProperty({ description: 'Sort order for displaying images', example: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'Image record creation timestamp' })
  createdAt: Date;
}
