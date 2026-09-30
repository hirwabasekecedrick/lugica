import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto.js';
import { StockMovementType, ReferenceType } from '@prisma/client';

@Injectable()
export class ProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async createSupplier(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async getSuppliers() {
    return this.prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  }

  async createGoodsReceipt(dto: CreateGoodsReceiptDto, receivedByUserId: string) {
    const { items, ...receiptData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Goods Receipt and Items
      const receipt = await tx.goodsReceipt.create({
        data: {
          ...receiptData,
          receivedByUserId,
          receivedAt: new Date(), // Set receivedAt
          items: {
            create: items.map((item) => ({
              ...item,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            })),
          },
        },
        include: { items: true },
      });

      // 2. Adjust stock and cost for accepted items
      for (const item of receipt.items) {
        if (item.quantityAccepted > 0) {
          // Update cost price on product
          await tx.product.update({
            where: { id: item.productId },
            data: { costPriceMinorUnits: item.unitCostMinorUnits },
          });

          await this.inventoryService.adjustStock(
            item.productId,
            item.quantityAccepted,
            StockMovementType.RECEIPT,
            receivedByUserId,
            ReferenceType.GOODS_RECEIPT_ITEM,
            item.id, // Reference is GoodsReceiptItem.id
            `Goods receipt from supplier`,
            tx, // Pass the transaction
          );
        }
      }

      return receipt;
    });
  }

  async getGoodsReceipts() {
    return this.prisma.goodsReceipt.findMany({
      orderBy: { createdAt: 'desc' },
      include: { supplier: true, items: true },
    });
  }

  async getGoodsReceiptById(id: string) {
    const receipt = await this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!receipt) throw new NotFoundException('Goods receipt not found');
    return receipt;
  }
}
