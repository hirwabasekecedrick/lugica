import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleOwnership, VehicleStatus } from '@prisma/client';

/**
 * Swagger-facing response entity for Vehicle.
 */
export class VehicleEntity {
  @ApiProperty({ description: 'Vehicle ID (UUID)', example: 'v1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Plate number', example: 'RAB 123 C' })
  plateNumber: string;

  @ApiProperty({ description: 'Vehicle type', example: 'truck' })
  type: string;

  @ApiProperty({ description: 'Carrying capacity in kg', example: 1500.0 })
  capacity: number;

  @ApiProperty({ description: 'Ownership type', enum: VehicleOwnership, example: VehicleOwnership.COMPANY })
  ownershipType: VehicleOwnership;

  @ApiPropertyOptional({ description: 'Owner driver ID (for INDIVIDUAL ownership)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  ownedByDriverId: string | null;

  @ApiPropertyOptional({ description: 'Currently assigned driver ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  assignedDriverId: string | null;

  @ApiProperty({ description: 'Vehicle status', enum: VehicleStatus, example: VehicleStatus.ACTIVE })
  status: VehicleStatus;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
