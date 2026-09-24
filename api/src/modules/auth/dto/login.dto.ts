import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').describe('User email address'),
  password: z.string().min(1, 'Password is required').describe('User password'),
});

export class LoginDto extends createZodDto(loginSchema) {}
