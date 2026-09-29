import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateProductDto } from '../catalog/dto/create-product.dto.js';
import { UpdateProductDto } from '../catalog/dto/update-product.dto.js';
import { CreateCategoryDto } from '../catalog/dto/create-category.dto.js';
import { UpdateCategoryDto } from '../catalog/dto/update-category.dto.js';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto.js';
import { ProductStatus, StockMovementType, ReferenceType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async computeSearchText(name: string, sku: string, categoryId: string): Promise<string> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    const categoryName = category ? category.name : '';
    return `${name} ${sku} ${categoryName}`.toLowerCase();
  }

  // --- Category Management ---

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: dto,
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.update({
      where: { id },
      data: dto,
    });
    
    // In a real app, updating category name might require updating searchText for all its products
    // For simplicity, we just update it here if needed, but the prompt says update on product create/update.
    return category;
  }

  // --- Product Management ---

  async createProduct(dto: CreateProductDto) {
    const searchText = await this.computeSearchText(dto.name, dto.sku, dto.categoryId);
    const { images, ...productData } = dto;

    return this.prisma.product.create({
      data: {
        ...productData,
        searchText,
        images: images ? { create: images } : undefined,
      },
    });
  }

  async getProducts(skip: number = 0, take: number = 20) {
    return this.prisma.product.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { images: true, category: true },
    });
  }

  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true, category: true, stockMovements: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    const name = dto.name ?? product.name;
    const sku = dto.sku ?? product.sku;
    const categoryId = dto.categoryId ?? product.categoryId;
    const searchText = await this.computeSearchText(name, sku, categoryId);

    const { images, ...productData } = dto;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        searchText,
        ...(images && {
          images: {
            deleteMany: {},
            create: images,
          },
        }),
      },
    });
  }

  async archiveProduct(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED },
    });
  }

  // --- Stock Management ---

  /**
   * The single method for all stock-changing operations.
   */
  async adjustStock(
    productId: string,
    quantityDelta: number,
    type: StockMovementType,
    performedByUserId: string,
    referenceType?: ReferenceType | null,
    referenceId?: string | null,
    notes?: string | null,
    txClient?: any,
  ): Promise<void> {
    const client = txClient || this.prisma;
    
    // If we were not given a transaction client, wrap in our own transaction.
    if (!txClient) {
      return this.prisma.$transaction(async (tx) => {
        return this.adjustStock(productId, quantityDelta, type, performedByUserId, referenceType, referenceId, notes, tx);
      });
    }

    // Inside transaction
    if (quantityDelta < 0) {
      const updated = await client.product.updateMany({
        where: {
          id: productId,
          stockQuantity: { gte: Math.abs(quantityDelta) },
        },
        data: {
          stockQuantity: { increment: quantityDelta },
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException(`Insufficient stock for product ${productId}`);
      }
    } else if (quantityDelta > 0) {
      await client.product.update({
        where: { id: productId },
        data: {
          stockQuantity: { increment: quantityDelta },
        },
      });
    }

    if (quantityDelta !== 0) {
      await client.stockMovement.create({
        data: {
          productId,
          type,
          quantity: quantityDelta,
          referenceType,
          referenceId,
          performedByUserId,
          notes,
        },
      });
    }
  }

  async manualStockAdjustment(productId: string, dto: StockAdjustmentDto, userId: string) {
    await this.adjustStock(
      productId,
      dto.quantityDelta,
      StockMovementType.ADJUSTMENT,
      userId,
      ReferenceType.MANUAL,
      null,
      dto.reason,
    );
    return { success: true };
  }
}
