import { ApiProperty } from '@nestjs/swagger';

export class WishlistItemEntity {
  @ApiProperty({ description: 'Wishlist item ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'User ID owning the wishlist item' })
  userId: string;

  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}
