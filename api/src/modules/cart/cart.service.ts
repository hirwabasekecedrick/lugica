import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    return cart;
  }

  async getCart(userId: string) {
    return this.getOrCreateCart(userId);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const existingItem = cart.items.find((i) => i.productId === dto.productId);
    const newQuantity = (existingItem?.quantity || 0) + dto.quantity;

    // Soft check
    if (newQuantity > product.stockQuantity) {
      throw new BadRequestException(`Only ${product.stockQuantity} units available`);
    }

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      return this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    }
  }

  async updateItemQuantity(userId: string, productId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);
    const existingItem = cart.items.find((i) => i.productId === productId);
    if (!existingItem) throw new NotFoundException('Item not in cart');

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    // Soft check
    if (dto.quantity > product.stockQuantity) {
      throw new BadRequestException(`Only ${product.stockQuantity} units available`);
    }

    return this.prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: dto.quantity },
    });
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getOrCreateCart(userId);
    const existingItem = cart.items.find((i) => i.productId === productId);
    if (!existingItem) throw new NotFoundException('Item not in cart');

    await this.prisma.cartItem.delete({
      where: { id: existingItem.id },
    });

    return { success: true };
  }
  
  async clearCart(userId: string, tx?: any) {
    const client = tx || this.prisma;
    const cart = await client.cart.findUnique({ where: { userId } });
    if (cart) {
      await client.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }
}
