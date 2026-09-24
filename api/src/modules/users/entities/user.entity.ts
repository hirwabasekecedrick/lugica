import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/**
 * Swagger-facing response entity for User.
 * Excludes passwordHash — never returned over HTTP.
 */
export class UserEntity {
  @ApiProperty({ description: 'User ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Email address', example: 'john@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+250788123456' })
  phone: string | null;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'User role', enum: Role, example: Role.CLIENT })
  role: Role;

  @ApiProperty({ description: 'Whether the account is active', example: true })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Driving license number (drivers only)', example: 'DL-2024-00123' })
  licenseNumber: string | null;

  @ApiPropertyOptional({ description: 'Whether the driver is available (drivers only)', example: true })
  isAvailable: boolean | null;

  @ApiProperty({ description: 'Account creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
