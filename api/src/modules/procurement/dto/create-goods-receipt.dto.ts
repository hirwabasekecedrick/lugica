import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createGoodsReceiptItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID').describe('ID of the product'),
  quantityDelivered: z.number().int().min(1).describe('Total quantity delivered'),
  quantityAccepted: z.number().int().min(0).describe('Quantity accepted into stock'),
  quantityRejected: z.number().int().min(0).describe('Quantity rejected'),
  unitCostMinorUnits: z.number().int().min(0).describe('Unit cost in minor units'),
  batchNumber: z.string().optional().describe('Batch number'),
  expiryDate: z.string().datetime().optional().describe('Expiry date (ISO string)'),
  conditionNotes: z.string().optional().describe('Notes on condition'),
}).refine(data => data.quantityDelivered === data.quantityAccepted + data.quantityRejected, {
  message: 'Delivered quantity must equal accepted + rejected',
  path: ['quantityDelivered'],
});

export const createGoodsReceiptSchema = z.object({
  supplierId: z.string().uuid('Invalid supplier ID').describe('ID of the supplier'),
  deliveredByName: z.string().min(1, 'Deliverer name is required').describe('Name of the person delivering'),
  deliveredByPhone: z.string().optional().describe('Phone number of the deliverer'),
  invoiceNumber: z.string().optional().describe('Invoice or reference number'),
  notes: z.string().optional().describe('General notes'),
  items: z.array(createGoodsReceiptItemSchema).min(1, 'At least one item is required').describe('Received items'),
});

export class CreateGoodsReceiptDto extends createZodDto(createGoodsReceiptSchema) {}
export class CreateGoodsReceiptItemDto extends createZodDto(createGoodsReceiptItemSchema) {}
