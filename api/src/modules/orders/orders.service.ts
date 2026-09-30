import { Injectable, BadRequestException, OnModuleInit, OnModuleDestroy, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { CartService } from '../cart/cart.service.js';
import { OrderStatus, StockMovementType, ReferenceType, DeliveryStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import { CheckoutDto } from './dto/checkout.dto.js';
import { CreateOrderDeliveryDto } from './dto/create-order-delivery.dto.js';

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

  async checkout(clientId: string, dto: CheckoutDto) {
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

      let shippingAddress = dto.shippingAddress || '';
      let shippingLat = dto.shippingLat;
      let shippingLng = dto.shippingLng;

      if (dto.savedLocationId) {
        const savedLocation = await tx.savedLocation.findUnique({
          where: { id: dto.savedLocationId },
        });
        if (!savedLocation || savedLocation.userId !== clientId) {
          throw new BadRequestException('Saved location not found or invalid');
        }
        shippingAddress = savedLocation.address;
        shippingLat = savedLocation.latitude;
        shippingLng = savedLocation.longitude;
      }

      // Create Order
      const order = await tx.order.create({
        data: {
          clientId,
          status: OrderStatus.PENDING_PAYMENT,
          totalMinorUnits,
          currency: 'RWF', // Assuming RWF or fetching from first product
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          shippingAddress,
          shippingLat,
          shippingLng,
          paymentMethod: dto.paymentMethod,
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

  async cancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === OrderStatus.FULFILLED) {
      throw new BadRequestException('Cannot cancel a fulfilled order');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  async fulfillOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Order must be paid before fulfillment');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.FULFILLED },
    });
  }

  async createDeliveryForOrder(orderId: string, dto: CreateOrderDeliveryDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.deliveryId) throw new BadRequestException('Order already has a delivery assigned');
    if (!order.shippingLat || !order.shippingLng) {
      throw new BadRequestException('Order is missing shipping coordinates');
    }

    return this.prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.create({
        data: {
          clientId: order.clientId,
          pickupAddress: dto.pickupAddress,
          pickupLat: dto.pickupLat,
          pickupLng: dto.pickupLng,
          dropoffAddress: order.shippingAddress,
          dropoffLat: order.shippingLat!,
          dropoffLng: order.shippingLng!,
          packageDetails: dto.packageDetails || `Order ${order.id}`,
          status: DeliveryStatus.PENDING,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { deliveryId: delivery.id },
      });

      return delivery;
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

    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages } };
  }

  async getClientOrderById(clientId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, clientId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
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

    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages } };
  }

  async getAdminOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, client: { select: { id: true, name: true, email: true, phone: true } } },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
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
