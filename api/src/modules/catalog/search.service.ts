import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProductStatus } from '@prisma/client';

export interface ProductSearchService {
  search(query: string, cursor?: string, limit?: number): Promise<any[]>;
}

@Injectable()
export class PrismaSearchService implements ProductSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, cursor?: string, limit: number = 20) {
    const q = query.toLowerCase();
    
    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        searchText: {
          contains: q,
          mode: 'insensitive',
        },
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        images: true,
      },
    });
  }
}
