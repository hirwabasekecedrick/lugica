import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryEntity {
  @ApiProperty({ description: 'Category ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  parentId: string | null;

  @ApiProperty({ description: 'Category creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Category last update timestamp' })
  updatedAt: Date;
}
