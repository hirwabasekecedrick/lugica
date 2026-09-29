import { Controller, Get, Post, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { QueryOrdersDto } from './dto/query-orders.dto.js';
import { OrderEntity } from './entities/order.entity.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders/checkout')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Checkout cart (CLIENT only)' })
  @ApiOkResponse({ type: OrderEntity })
  async checkout(@CurrentUser() user: JwtPayload) {
    return this.ordersService.checkout(user.sub);
  }

  @Get('orders')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Get own orders (CLIENT only)' })
  async getOwnOrders(@CurrentUser() user: JwtPayload, @Query() query: QueryOrdersDto) {
    return this.ordersService.getClientOrders(user.sub, query.page, query.limit, query.status);
  }

  @Get('admin/orders')
  @Roles(Role.ADMIN, Role.SHOP_MANAGER)
  @ApiOperation({ summary: 'Get all orders (SHOP_MANAGER/ADMIN)' })
  async getAllOrders(@Query() query: QueryOrdersDto) {
    return this.ordersService.getAllOrders(query.page, query.limit, query.status);
  }
}
