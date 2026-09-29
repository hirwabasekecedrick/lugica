import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { ActivityService } from './activity.service.js';
import { ProductEntity } from '../catalog/entities/product.entity.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Activity')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CLIENT)
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('recently-viewed')
  @ApiOperation({ summary: 'Get recently viewed products (client only)' })
  @ApiOkResponse({ type: [ProductEntity] })
  async getRecentlyViewed(@CurrentUser() user: JwtPayload) {
    return this.activityService.getRecentlyViewed(user.sub);
  }

  @Get('last-purchased')
  @ApiOperation({ summary: 'Get last purchased products (client only)' })
  @ApiOkResponse({ type: [ProductEntity] })
  async getLastPurchased(@CurrentUser() user: JwtPayload) {
    return this.activityService.getLastPurchased(user.sub);
  }
}
