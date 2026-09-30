import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { CreateSavedLocationDto } from './dto/create-saved-location.dto.js';
import { UserEntity } from './entities/user.entity.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';
import { Role } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create a new user (admin only)',
    description: 'Admins can create new users, typically used for creating DRIVER or other ADMIN accounts.',
  })
  @ApiOkResponse({ description: 'User created successfully', type: UserEntity })
  @ApiBadRequestResponse({ description: 'Validation error or email already registered' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List users (admin only)',
    description:
      'Returns a paginated list of users. Supports filtering by role (e.g., ?role=DRIVER). Admin access only.',
  })
  @ApiOkResponse({
    description: 'Paginated list of users',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/UserEntity' } },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user profile',
    description:
      'Admins can update any user. Non-admin users can only update their own profile and cannot change isActive.',
  })
  @ApiOkResponse({ description: 'User updated successfully', type: UserEntity })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  @ApiForbiddenResponse({ description: 'Cannot update another user or restricted field' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.usersService.update(id, dto, currentUser);
  }

  // ─── Saved Locations ──────────────────────────────────────────────────────

  @Post('me/locations')
  @ApiOperation({
    summary: 'Save a location',
    description: 'Allows a user to save a new location (e.g., Home, Work) for deliveries.',
  })
  @ApiOkResponse({ description: 'Location saved successfully' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  async createSavedLocation(
    @Body() dto: CreateSavedLocationDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.usersService.createSavedLocation(currentUser.sub, dto);
  }

  @Get('me/locations')
  @ApiOperation({
    summary: 'Get saved locations',
    description: 'Retrieves all saved locations for the authenticated user.',
  })
  @ApiOkResponse({ description: 'List of saved locations' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  async getSavedLocations(@CurrentUser() currentUser: JwtPayload) {
    return this.usersService.getSavedLocations(currentUser.sub);
  }

  @Delete('me/locations/:locationId')
  @ApiOperation({
    summary: 'Delete a saved location',
    description: 'Deletes a saved location belonging to the authenticated user.',
  })
  @ApiOkResponse({ description: 'Location deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  @ApiForbiddenResponse({ description: 'Cannot delete another user\'s location' })
  @ApiNotFoundResponse({ description: 'Location not found' })
  async deleteSavedLocation(
    @Param('locationId') locationId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.usersService.deleteSavedLocation(currentUser.sub, locationId);
  }
}
