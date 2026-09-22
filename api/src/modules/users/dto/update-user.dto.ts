import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Role } from '@prisma/client';

export const updateUserSchema = z.object({
  name: z.string().min(1).optional().describe('Full name of the user'),
  phone: z.string().optional().describe('Phone number'),
  role: z.nativeEnum(Role).optional().describe('Role of the user'),
  licenseNumber: z.string().optional().describe('License number'),
  isActive: z.boolean().optional().describe('Whether the user account is active'),
  isAvailable: z.boolean().optional().describe('Whether the driver is available for deliveries'),
});

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
