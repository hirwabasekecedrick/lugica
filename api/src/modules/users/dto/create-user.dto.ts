import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format').describe('User email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .describe('User password (minimum 8 characters)'),
  name: z.string().min(1, 'Name is required').describe('Full name of the user'),
  phone: z.string().optional().describe('Phone number'),
  role: z.nativeEnum(Role).describe('Role of the user'),
  licenseNumber: z.string().optional().describe('License number (required if role is DRIVER)'),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
