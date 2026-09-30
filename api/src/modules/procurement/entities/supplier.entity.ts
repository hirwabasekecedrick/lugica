import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierEntity {
  @ApiProperty({ description: 'Supplier ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Supplier name' })
  name: string;

  @ApiPropertyOptional({ description: 'Contact person name' })
  contactName: string | null;

  @ApiPropertyOptional({ description: 'Phone number' })
  phone: string | null;

  @ApiPropertyOptional({ description: 'Email address' })
  email: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
