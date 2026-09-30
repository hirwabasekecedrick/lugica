import { ApiProperty } from '@nestjs/swagger';

export class CartItemEntity {
  @ApiProperty({ description: 'Cart item ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Cart ID' })
  cartId: string;

  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Quantity in cart' })
  quantity: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class CartEntity {
  @ApiProperty({ description: 'Cart ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'User ID owning the cart' })
  userId: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ type: [CartItemEntity], description: 'Items in the cart' })
  items: CartItemEntity[];
}
