import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { CartService } from '../cart/cart.service.js';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, ProductStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

describe('OrdersService - Concurrent Checkouts', () => {
  let ordersService: OrdersService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        PrismaService, // Needs a real DB connection for concurrency testing
        {
          provide: InventoryService,
          useValue: { adjustStock: vi.fn() }, // Not fully used in this test
        },
        CartService,
        {
          provide: ConfigService,
          useValue: { get: () => 1800000 },
        },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should prevent concurrent checkouts from overselling the last unit', async () => {
    // 1. Setup seed data
    const category = await prismaService.category.create({
      data: { name: `TestCat-${randomUUID()}` },
    });

    const product = await prismaService.product.create({
      data: {
        sku: `SKU-${randomUUID()}`,
        name: 'Last Item',
        description: 'Test',
        categoryId: category.id,
        priceMinorUnits: 1000,
        stockQuantity: 1, // Only 1 unit!
        searchText: 'last item',
        status: ProductStatus.ACTIVE,
      },
    });

    const user1Id = randomUUID();
    const user2Id = randomUUID();

    // Setup carts for 2 users, both trying to buy 1 unit
    const cart1 = await prismaService.cart.create({ data: { userId: user1Id } });
    await prismaService.cartItem.create({
      data: { cartId: cart1.id, productId: product.id, quantity: 1 },
    });

    const cart2 = await prismaService.cart.create({ data: { userId: user2Id } });
    await prismaService.cartItem.create({
      data: { cartId: cart2.id, productId: product.id, quantity: 1 },
    });

    // 2. Fire two checkouts concurrently
    const results = await Promise.allSettled([
      ordersService.checkout(user1Id),
      ordersService.checkout(user2Id),
    ]);

    // 3. Verify exactly one succeeded and one failed
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    if (rejected[0].status === 'rejected') {
      expect(rejected[0].reason.message).toContain('Insufficient stock');
    }

    // Verify stock is 0
    const updatedProduct = await prismaService.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.stockQuantity).toBe(0);
  });
});
