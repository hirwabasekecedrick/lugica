import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service.js';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto.js';
import { WishlistItemEntity } from './entities/wishlist-item.entity.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Wishlist')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CLIENT)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user wishlist' })
  @ApiOkResponse({ type: [WishlistItemEntity] })
  async getWishlist(@CurrentUser() user: JwtPayload) {
    return this.wishlistService.getWishlist(user.sub);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to wishlist' })
  @ApiOkResponse({ type: WishlistItemEntity })
  async addItem(@CurrentUser() user: JwtPayload, @Body() dto: AddWishlistItemDto) {
    return this.wishlistService.addItem(user.sub, dto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove item from wishlist' })
  async removeItem(@CurrentUser() user: JwtPayload, @Param('productId') productId: string) {
    return this.wishlistService.removeItem(user.sub, productId);
  }
}
