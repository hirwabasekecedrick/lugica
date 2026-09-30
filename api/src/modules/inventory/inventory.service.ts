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

  private async computeSearchText(name: string, sku: string, description: string, categoryId: string): Promise<string> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    const categoryName = category ? category.name : '';
    return `${name} ${sku} ${description} ${categoryName}`.toLowerCase();
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
    
    if (dto.name) {
      // Recompute searchText for all products in this category
      const products = await this.prisma.product.findMany({ where: { categoryId: id } });
      for (const product of products) {
        const searchText = await this.computeSearchText(product.name, product.sku, product.description, id);
        await this.prisma.product.update({ where: { id: product.id }, data: { searchText } });
      }
    }

    return category;
  }

  // --- Product Management ---

  async createProduct(dto: CreateProductDto) {
    const searchText = await this.computeSearchText(dto.name, dto.sku, dto.description, dto.categoryId);
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
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { images: true, category: true },
      }),
      this.prisma.product.count(),
    ]);
    
    const page = Math.floor(skip / take) + 1;
    const limit = take;
    const totalPages = Math.ceil(total / limit);

    return { data, meta: { total, page, limit, totalPages } };
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
    const description = dto.description ?? product.description;
    const categoryId = dto.categoryId ?? product.categoryId;
    const searchText = await this.computeSearchText(name, sku, description, categoryId);

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

  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { orderItems: true },
    });
    
    if (!product) throw new NotFoundException('Product not found');
    if (product.orderItems.length > 0) {
      throw new BadRequestException('Cannot delete product with order history. Archive it instead.');
    }

    // Delete associated images and stock movements first
    await this.prisma.productImage.deleteMany({ where: { productId: id } });
    await this.prisma.stockMovement.deleteMany({ where: { productId: id } });
    
    return this.prisma.product.delete({ where: { id } });
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

  async getStockMovements(productId?: string, startDate?: string, endDate?: string, page = 1, limit = 50) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { id: true, name: true, sku: true } }, performedByUser: { select: { id: true, name: true } } },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages } };
  }
}
