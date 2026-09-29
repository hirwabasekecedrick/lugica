import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryStatus } from '@prisma/client';

/**
 * Swagger-facing response entity for Delivery.
 */
export class DeliveryEntity {
  @ApiProperty({ description: 'Delivery ID (UUID)', example: 'd1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Client user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  clientId: string;

  @ApiPropertyOptional({ description: 'Assigned driver user ID' })
  driverId: string | null;

  @ApiPropertyOptional({ description: 'Assigned vehicle ID' })
  vehicleId: string | null;

  @ApiProperty({ description: 'Pickup address', example: '123 KG 7 Ave, Kigali' })
  pickupAddress: string;

  @ApiProperty({ description: 'Pickup latitude', example: -1.9403 })
  pickupLat: number;

  @ApiProperty({ description: 'Pickup longitude', example: 29.8739 })
  pickupLng: number;

  @ApiProperty({ description: 'Dropoff address', example: '456 KN 3 St, Kigali' })
  dropoffAddress: string;

  @ApiProperty({ description: 'Dropoff latitude', example: -1.9556 })
  dropoffLat: number;

  @ApiProperty({ description: 'Dropoff longitude', example: 29.8468 })
  dropoffLng: number;

  @ApiProperty({ description: 'Current delivery status', enum: DeliveryStatus, example: DeliveryStatus.PENDING })
  status: DeliveryStatus;

  @ApiPropertyOptional({ description: 'Estimated delivery time' })
  estimatedDeliveryAt: Date | null;

  @ApiPropertyOptional({ description: 'Actual delivery timestamp' })
  deliveredAt: Date | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
