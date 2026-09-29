import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class OrderItemEntity {
  @ApiProperty({ description: 'Order item ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Snapshot of product name at order time' })
  productNameSnapshot: string;

  @ApiProperty({ description: 'Snapshot of unit price in minor units' })
  unitPriceMinorUnitsSnapshot: number;

  @ApiProperty({ description: 'Quantity ordered' })
  quantity: number;
}

export class OrderEntity {
  @ApiProperty({ description: 'Order ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Client ID who placed the order' })
  clientId: string;

  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Total cost in minor units' })
  totalMinorUnits: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'Linked delivery ID (if fulfilled/assigned)' })
  deliveryId: string | null;

  @ApiProperty({ description: 'Timestamp when order expires if unpaid' })
  expiresAt: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: [OrderItemEntity], description: 'Items in the order' })
  items?: OrderItemEntity[];
}
