import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockMovementType, ReferenceType } from '@prisma/client';

export class StockMovementEntity {
  @ApiProperty({ description: 'Movement ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Type of movement', enum: StockMovementType })
  type: StockMovementType;

  @ApiProperty({ description: 'Quantity changed (positive or negative)' })
  quantity: number;

  @ApiPropertyOptional({ description: 'Type of reference causing movement', enum: ReferenceType })
  referenceType: ReferenceType | null;

  @ApiPropertyOptional({ description: 'ID of the reference (e.g. order ID, receipt ID)' })
  referenceId: string | null;

  @ApiProperty({ description: 'ID of user who performed the action' })
  performedByUserId: string;

  @ApiPropertyOptional({ description: 'Additional notes or reason' })
  notes: string | null;

  @ApiProperty({ description: 'Timestamp of the movement' })
  createdAt: Date;
}
