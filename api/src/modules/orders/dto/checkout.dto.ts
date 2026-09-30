import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const checkoutSchema = z.object({
  customerName: z.string().min(1, 'Name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().min(1, 'Phone is required'),
  shippingAddress: z.string().optional().describe('Shipping address (if not using savedLocationId)'),
  savedLocationId: z.string().optional().describe('ID of the saved location (Home/Work)'),
  shippingLat: z.number().optional().describe('Shipping latitude'),
  shippingLng: z.number().optional().describe('Shipping longitude'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
}).refine(data => data.shippingAddress || data.savedLocationId, {
  message: "Either shippingAddress or savedLocationId is required",
  path: ["shippingAddress"]
});

export class CheckoutDto extends createZodDto(checkoutSchema) {}
