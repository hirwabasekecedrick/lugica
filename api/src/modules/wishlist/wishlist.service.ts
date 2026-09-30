import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto.js';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { images: true } } },
    });
  }

  async addItem(userId: string, dto: AddWishlistItemDto) {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId,
        },
      },
    });

    if (existing) {
      return existing; // Already in wishlist
    }

    try {
      return await this.prisma.wishlistItem.create({
        data: {
          userId,
          productId: dto.productId,
        },
      });
    } catch (error) {
      throw new BadRequestException('Invalid product ID');
    }
  }

  async removeItem(userId: string, productId: string) {
    try {
      await this.prisma.wishlistItem.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
    } catch (error) {
      // Ignore if not found
    }

    return { success: true };
  }
}
