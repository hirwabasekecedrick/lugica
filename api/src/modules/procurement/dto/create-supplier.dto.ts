import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').describe('Name of the supplier'),
  contactName: z.string().optional().describe('Contact person name'),
  phone: z.string().optional().describe('Phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')).describe('Email address'),
});

export class CreateSupplierDto extends createZodDto(createSupplierSchema) {}
