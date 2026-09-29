import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').describe('The refresh token provided during login'),
});

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}
