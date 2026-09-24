import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format').describe('User email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .describe('User password (minimum 8 characters)'),
  name: z.string().min(1, 'Name is required').describe('Full name of the user'),
  phone: z.string().optional().describe('Phone number'),
});

export class RegisterDto extends createZodDto(registerSchema) {}
