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
import { VehiclesService } from './vehicles.service.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { AssignDriverDto } from './dto/assign-driver.dto.js';
import { VehicleEntity } from './entities/vehicle.entity.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('Vehicles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create a vehicle (admin only)',
    description:
      'Creates a new vehicle. Enforces ownershipType/ownedByDriverId consistency: INDIVIDUAL requires an owner, COMPANY rejects one.',
  })
  @ApiCreatedResponse({ description: 'Vehicle created', type: VehicleEntity })
  @ApiBadRequestResponse({ description: 'Validation error or ownership inconsistency' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List all vehicles (admin only)',
    description: 'Returns all vehicles with owner and assigned driver details.',
  })
  @ApiOkResponse({ description: 'List of vehicles', type: [VehicleEntity] })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async findAll() {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get vehicle details (admin only)',
    description: 'Returns a single vehicle with owner, assigned driver, and recent assignment history.',
  })
  @ApiOkResponse({ description: 'Vehicle details', type: VehicleEntity })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async findById(@Param('id') id: string) {
    return this.vehiclesService.findById(id);
  }

  @Patch(':id/assign-driver')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Assign a driver to a vehicle (admin only)',
    description:
      'Atomically closes the prior assignment (if any), creates a new VehicleAssignment record, and updates the vehicle\'s assignedDriverId.',
  })
  @ApiOkResponse({ description: 'Driver assigned to vehicle', type: VehicleEntity })
  @ApiBadRequestResponse({ description: 'Invalid driver or validation error' })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async assignDriver(
    @Param('id') id: string,
    @Body() dto: AssignDriverDto,
  ) {
    return this.vehiclesService.assignDriver(id, dto);
  }
}
