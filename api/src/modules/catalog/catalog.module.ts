import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';
import { PrismaSearchService } from './search.service.js';
import { ActivityModule } from '../activity/activity.module.js';

@Module({
  imports: [ActivityModule],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    {
      provide: 'ProductSearchService',
      useClass: PrismaSearchService,
    },
  ],
  exports: [CatalogService],
})
export class CatalogModule {}
