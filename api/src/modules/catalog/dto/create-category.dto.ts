import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').describe('Name of the category'),
  parentId: z.string().uuid('Invalid parent ID').optional().describe('ID of parent category (if subcategory)'),
});

export class CreateCategoryDto extends createZodDto(createCategorySchema) {}
