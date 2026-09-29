import { Controller, Get, Param, Query, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { CatalogService } from './catalog.service.js';
import { PrismaSearchService } from './search.service.js';
import type { ProductSearchService } from './search.service.js';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { SearchProductsDto } from './dto/search-products.dto.js';
import { ProductEntity } from './entities/product.entity.js';
import { CategoryEntity } from './entities/category.entity.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard.js';
import { ActivityService } from '../activity/activity.service.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Catalog')
@Controller()
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    @Inject('ProductSearchService') private readonly searchService: ProductSearchService,
    private readonly activityService: ActivityService,
  ) {}

  @Get('products')
  @ApiOperation({ summary: 'List products (public)' })
  @ApiOkResponse({ type: [ProductEntity] })
  async getProducts(@Query() query: QueryProductsDto) {
    return this.catalogService.getProducts(query, false);
  }

  @Get('products/new-arrivals')
  @ApiOperation({ summary: 'List new arrivals (public)' })
  @ApiOkResponse({ type: [ProductEntity] })
  async getNewArrivals(@Query('cursor') cursor?: string, @Query('limit') limit?: number) {
    return this.catalogService.getNewArrivals(cursor, limit ? Number(limit) : 20);
  }

  @Get('products/search')
  @ApiOperation({ summary: 'Search products (public)' })
  @ApiOkResponse({ type: [ProductEntity] })
  async searchProducts(@Query() query: SearchProductsDto) {
    return this.searchService.search(query.q, query.cursor, query.limit);
  }

  @Get('products/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get product by ID (public)' })
  @ApiOkResponse({ type: ProductEntity })
  async getProductById(@Param('id') id: string, @CurrentUser() user: JwtPayload | null) {
    const product = await this.catalogService.getProductById(id, false);
    
    // Record recently viewed if user is authenticated
    if (user && user.sub) {
      await this.activityService.recordProductView(user.sub, id);
    }
    
    return product;
  }

  @Get('categories')
  @ApiOperation({ summary: 'List category tree (public)' })
  @ApiOkResponse({ type: [CategoryEntity] })
  async getCategories() {
    return this.catalogService.getCategories();
  }
}
