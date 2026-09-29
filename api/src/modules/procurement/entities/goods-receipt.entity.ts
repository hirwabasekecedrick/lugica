import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupplierEntity } from './supplier.entity.js';

export class GoodsReceiptItemEntity {
  @ApiProperty({ description: 'Item ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Goods receipt ID' })
  goodsReceiptId: string;

  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Total quantity delivered' })
  quantityDelivered: number;

  @ApiProperty({ description: 'Quantity accepted' })
  quantityAccepted: number;

  @ApiProperty({ description: 'Quantity rejected' })
  quantityRejected: number;

  @ApiProperty({ description: 'Unit cost in minor units' })
  unitCostMinorUnits: number;

  @ApiPropertyOptional({ description: 'Batch number' })
  batchNumber: string | null;

  @ApiPropertyOptional({ description: 'Expiry date' })
  expiryDate: Date | null;

  @ApiPropertyOptional({ description: 'Notes on condition' })
  conditionNotes: string | null;
}

export class GoodsReceiptEntity {
  @ApiProperty({ description: 'Receipt ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Name of the person delivering' })
  deliveredByName: string;

  @ApiPropertyOptional({ description: 'Phone of the deliverer' })
  deliveredByPhone: string | null;

  @ApiPropertyOptional({ description: 'Invoice number' })
  invoiceNumber: string | null;

  @ApiProperty({ description: 'ID of the user who received' })
  receivedByUserId: string;

  @ApiProperty({ description: 'Timestamp when received' })
  receivedAt: Date;

  @ApiPropertyOptional({ description: 'General notes' })
  notes: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ type: [GoodsReceiptItemEntity], description: 'Received items' })
  items?: GoodsReceiptItemEntity[];

  @ApiPropertyOptional({ type: () => SupplierEntity })
  supplier?: SupplierEntity;
}
