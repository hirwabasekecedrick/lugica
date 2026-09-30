import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const checkoutSchema = z.object({
  customerName: z.string().min(1, 'Name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().min(1, 'Phone is required'),
  shippingAddress: z.string().min(1, 'Shipping address is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
});

export class CheckoutDto extends createZodDto(checkoutSchema) {}
