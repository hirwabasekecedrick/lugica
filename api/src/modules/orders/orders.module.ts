import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { CartModule } from '../cart/cart.module.js';

@Module({
  imports: [InventoryModule, CartModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
