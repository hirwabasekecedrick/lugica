import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const stockAdjustmentSchema = z.object({
  quantityDelta: z.number().int().describe('Quantity change (positive to increase, negative to decrease)'),
  reason: z.string().min(1, 'Reason is required').describe('Reason for adjustment'),
});

export class StockAdjustmentDto extends createZodDto(stockAdjustmentSchema) {}
