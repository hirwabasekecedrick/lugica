import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private getRecentlyViewedKey(userId: string) {
    return `activity:recently-viewed:${userId}`;
  }

  async recordProductView(userId: string, productId: string) {
    const key = this.getRecentlyViewedKey(userId);
    const timestamp = Date.now();

    const client = this.redis.clientInstance;
    const pipeline = client.pipeline();

    // Add to sorted set
    pipeline.zadd(key, timestamp, productId);
    // Keep only last 20
    pipeline.zremrangebyrank(key, 0, -21);
    // Set TTL (e.g. 7 days)
    pipeline.expire(key, 7 * 24 * 60 * 60);

    await pipeline.exec();
  }

  async getRecentlyViewed(userId: string) {
    const key = this.getRecentlyViewedKey(userId);
    const client = this.redis.clientInstance;

    // Get product IDs ordered by score descending
    const productIds = await client.zrevrange(key, 0, 19);

    if (productIds.length === 0) return [];

    // Fetch products
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { images: true },
    });

    // Sort to match Redis order
    return productIds.map((id: string) => products.find(p => p.id === id)).filter(Boolean);
  }

  async getLastPurchased(userId: string) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          clientId: userId,
          status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] },
        },
      },
      orderBy: { order: { createdAt: 'desc' } },
      take: 20,
      distinct: ['productId'], // This is supported in Prisma for distinct field selection
      include: { product: { include: { images: true } } },
    });

    return orderItems.map(item => item.product).filter(Boolean);
  }
}
