import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { ProcurementService } from './procurement.service.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto.js';
import { SupplierEntity } from './entities/supplier.entity.js';
import { GoodsReceiptEntity } from './entities/goods-receipt.entity.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Admin / Procurement')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SHOP_MANAGER)
@Controller()
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post('suppliers')
  @ApiOperation({ summary: 'Create a supplier (admin/manager)' })
  @ApiOkResponse({ type: SupplierEntity })
  async createSupplier(@Body() dto: CreateSupplierDto) {
    return this.procurementService.createSupplier(dto);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'List all suppliers (admin/manager)' })
  @ApiOkResponse({ type: [SupplierEntity] })
  async getSuppliers() {
    return this.procurementService.getSuppliers();
  }

  @Post('goods-receipts')
  @ApiOperation({ summary: 'Record a goods receipt (admin/manager)' })
  @ApiOkResponse({ type: GoodsReceiptEntity })
  async createGoodsReceipt(@Body() dto: CreateGoodsReceiptDto, @CurrentUser() user: JwtPayload) {
    return this.procurementService.createGoodsReceipt(dto, user.sub);
  }

  @Get('goods-receipts')
  @ApiOperation({ summary: 'List all goods receipts (admin/manager)' })
  @ApiOkResponse({ type: [GoodsReceiptEntity] })
  async getGoodsReceipts() {
    return this.procurementService.getGoodsReceipts();
  }

  @Get('goods-receipts/:id')
  @ApiOperation({ summary: 'Get a goods receipt by ID (admin/manager)' })
  @ApiOkResponse({ type: GoodsReceiptEntity })
  async getGoodsReceiptById(@Param('id') id: string) {
    return this.procurementService.getGoodsReceiptById(id);
  }
}
