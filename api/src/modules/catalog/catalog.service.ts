import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getProducts(query: QueryProductsDto, isStaff: boolean = false) {
    const { cursor, limit = 20, categoryId, minPrice, maxPrice, inStock, sortBy } = query;

    const where: any = {};
    if (!isStaff) {
      where.status = ProductStatus.ACTIVE;
    }
    if (categoryId) where.categoryId = categoryId;
    if (minPrice !== undefined) where.priceMinorUnits = { ...where.priceMinorUnits, gte: minPrice };
    if (maxPrice !== undefined) where.priceMinorUnits = { ...where.priceMinorUnits, lte: maxPrice };
    if (inStock) where.stockQuantity = { gt: 0 };

    let orderBy: any = undefined;
    if (sortBy === 'price_asc') orderBy = { priceMinorUnits: 'asc' };
    else if (sortBy === 'price_desc') orderBy = { priceMinorUnits: 'desc' };
    else if (sortBy === 'newest') orderBy = { createdAt: 'desc' };

    const products = await this.prisma.product.findMany({
      where,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true } },
      },
    });

    const nextCursor = products.length === limit ? products[products.length - 1].id : null;
    return { data: products, meta: { nextCursor } };
  }

  async getProductById(id: string, isStaff: boolean = false) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product || (!isStaff && product.status !== ProductStatus.ACTIVE)) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async getNewArrivals(cursor?: string, limit: number = 20) {
    const products = await this.prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true } },
      },
    });

    const nextCursor = products.length === limit ? products[products.length - 1].id : null;
    return { data: products, meta: { nextCursor } };
  }

  async getCategories() {
    const allCategories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    // Build category tree
    const rootCategories = allCategories.filter((c) => !c.parentId);
    const buildTree = (category: any) => {
      category.children = allCategories
        .filter((c) => c.parentId === category.id)
        .map(buildTree);
      return category;
    };

    return rootCategories.map(buildTree);
  }
}
