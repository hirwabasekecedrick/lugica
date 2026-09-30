import { Controller, Post, Patch, Param, Body, UseGuards, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { InventoryService } from './inventory.service.js';
import { CreateProductDto } from '../catalog/dto/create-product.dto.js';
import { UpdateProductDto } from '../catalog/dto/update-product.dto.js';
import { CreateCategoryDto } from '../catalog/dto/create-category.dto.js';
import { UpdateCategoryDto } from '../catalog/dto/update-category.dto.js';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto.js';
import { ProductEntity } from '../catalog/entities/product.entity.js';
import { CategoryEntity } from '../catalog/entities/category.entity.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Admin / Inventory')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SHOP_MANAGER)
@Controller('admin')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('categories')
  @ApiOperation({ summary: 'Create category (admin/manager)' })
  @ApiOkResponse({ type: CategoryEntity })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.inventoryService.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update category (admin/manager)' })
  @ApiOkResponse({ type: CategoryEntity })
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.inventoryService.updateCategory(id, dto);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create product (admin/manager)' })
  @ApiOkResponse({ type: ProductEntity })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.inventoryService.createProduct(dto);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update product (admin/manager)' })
  @ApiOkResponse({ type: ProductEntity })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.inventoryService.updateProduct(id, dto);
  }

  @Patch('products/:id/archive')
  @ApiOperation({ summary: 'Archive product (admin/manager)' })
  @ApiOkResponse({ type: ProductEntity })
  async archiveProduct(@Param('id') id: string) {
    return this.inventoryService.archiveProduct(id);
  }

  @Get('products')
  @ApiOperation({ summary: 'List all products (admin/manager)' })
  @ApiOkResponse({ type: [ProductEntity] })
  async getProductsAdmin(@Query('page') page?: string, @Query('limit') limit?: string) {
    const skip = page ? (Number(page) - 1) * (Number(limit) || 20) : 0;
    return this.inventoryService.getProducts(skip, Number(limit) || 20);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID (admin/manager)' })
  @ApiOkResponse({ type: ProductEntity })
  async getProductAdmin(@Param('id') id: string) {
    return this.inventoryService.getProductById(id);
  }

  @Post('products/:id/stock-adjustment')
  @ApiOperation({ summary: 'Manual stock adjustment (admin/manager)' })
  async adjustStock(
    @Param('id') id: string,
    @Body() dto: StockAdjustmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.inventoryService.manualStockAdjustment(id, dto, user.sub);
  }
}
