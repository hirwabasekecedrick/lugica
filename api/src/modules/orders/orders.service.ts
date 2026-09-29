import { Injectable, BadRequestException, OnModuleInit, OnModuleDestroy, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { CartService } from '../cart/cart.service.js';
import { OrderStatus, StockMovementType, ReferenceType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  private expiryInterval: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly cartService: CartService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    // Run every minute to clean up expired orders
    this.expiryInterval = setInterval(() => this.expireOrders(), 60000);
  }

  onModuleDestroy() {
    if (this.expiryInterval) clearInterval(this.expiryInterval);
  }

  async checkout(clientId: string) {
    const cart = await this.cartService.getCart(clientId);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const expiryWindowMs = this.configService.get<number>('ORDER_EXPIRY_WINDOW_MS', 30 * 60 * 1000); // 30 mins default

    return this.prisma.$transaction(async (tx) => {
      let totalMinorUnits = 0;
      const orderItemsData = [];

      for (const item of cart.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new BadRequestException(`Product ${item.productId} not found`);

        // Atomically decrement stock
        const updated = await tx.product.updateMany({
          where: {
            id: product.id,
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });

        if (updated.count === 0) {
          throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
        }

        totalMinorUnits += product.priceMinorUnits * item.quantity;
        orderItemsData.push({
          productId: product.id,
          productNameSnapshot: product.name,
          unitPriceMinorUnitsSnapshot: product.priceMinorUnits,
          quantity: item.quantity,
        });
      }

      // Create Order
      const order = await tx.order.create({
        data: {
          clientId,
          status: OrderStatus.PENDING_PAYMENT,
          totalMinorUnits,
          currency: 'RWF', // Assuming RWF or fetching from first product
          expiresAt: new Date(Date.now() + expiryWindowMs),
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      // Write SALE StockMovements
      for (const item of order.items) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: StockMovementType.SALE,
            quantity: -item.quantity,
            referenceType: ReferenceType.ORDER,
            referenceId: order.id,
            performedByUserId: clientId,
            notes: 'Order checkout',
          },
        });
      }

      // Clear the cart
      await this.cartService.clearCart(clientId, tx);

      return order;
    });
  }

  /**
   * SEAM FOR FUTURE PAYMENT MODULE
   * Call this when a payment is successful.
   */
  async markOrderPaid(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is not pending payment');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
    });
  }

  async getClientOrders(clientId: string, page = 1, limit = 20, status?: OrderStatus) {
    const where: any = { clientId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async getAllOrders(page = 1, limit = 20, status?: OrderStatus) {
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async expireOrders() {
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        expiresAt: { lt: new Date() },
      },
      include: { items: true },
    });

    for (const order of expiredOrders) {
      await this.prisma.$transaction(async (tx) => {
        // Double check status to avoid race condition
        const currentOrder = await tx.order.findUnique({ where: { id: order.id } });
        if (currentOrder?.status !== OrderStatus.PENDING_PAYMENT) return;

        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.EXPIRED },
        });

        for (const item of order.items) {
          // Release stock back
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });

          // Write RELEASE stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: StockMovementType.RELEASE,
              quantity: item.quantity,
              referenceType: ReferenceType.ORDER,
              referenceId: order.id,
              performedByUserId: order.clientId, // Or system ID
              notes: 'Order expired, stock released',
            },
          });
        }
      });
    }
  }
}
