import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DeliveriesService } from './deliveries.service.js';
import { CreateDeliveryDto } from './dto/create-delivery.dto.js';
import { AssignDeliveryDto } from './dto/assign-delivery.dto.js';
import { DeliveryEntity } from './entities/delivery.entity.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Deliveries')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  @Roles(Role.CLIENT)
  @ApiOperation({
    summary: 'Create a delivery request (client only)',
    description:
      'Creates a new delivery with status PENDING. The client is automatically set from the authenticated user.',
  })
  @ApiCreatedResponse({ description: 'Delivery created', type: DeliveryEntity })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  @ApiForbiddenResponse({ description: 'Client role required' })
  async create(
    @Body() dto: CreateDeliveryDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.deliveriesService.create(dto, currentUser);
  }

  @Get()
  @ApiOperation({
    summary: 'List deliveries (role-aware)',
    description:
      'Admin: sees all deliveries. Client: sees only their own. Driver: sees only deliveries assigned to them.',
  })
  @ApiOkResponse({ description: 'List of deliveries', type: [DeliveryEntity] })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  async findAll(@CurrentUser() currentUser: JwtPayload) {
    return this.deliveriesService.findAll(currentUser);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get delivery details (role-aware)',
    description:
      'Returns delivery details including status history. Admin: any delivery. Client: only own. Driver: only assigned.',
  })
  @ApiOkResponse({ description: 'Delivery details', type: DeliveryEntity })
  @ApiNotFoundResponse({ description: 'Delivery not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  @ApiForbiddenResponse({ description: 'Access denied to this delivery' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.deliveriesService.findById(id, currentUser);
  }

  @Patch(':id/assign')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Assign driver and vehicle to a delivery (admin only)',
    description:
      'Sets driverId and vehicleId, transitions status from PENDING → ASSIGNED, and creates a DeliveryStatusHistory entry. All within a single transaction.',
  })
  @ApiOkResponse({ description: 'Delivery assigned', type: DeliveryEntity })
  @ApiBadRequestResponse({ description: 'Invalid driver/vehicle or delivery not PENDING' })
  @ApiNotFoundResponse({ description: 'Delivery not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignDeliveryDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.deliveriesService.assign(id, dto, currentUser);
  }
}
