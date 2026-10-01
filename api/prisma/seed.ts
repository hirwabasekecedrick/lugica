import { PrismaClient, Role, ProductStatus, StockMovementType, OrderStatus, ReferenceType } from '@prisma/client';
import { hash } from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Seed script refused to run in production environment.');
    process.exit(1);
  }

  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'Admin@123';
  const passwordHash = await hash(defaultPassword, 12);

  console.log('Seeding Users...');
  
  // Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lugica.com';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      name: 'System Admin',
      phone: '+250780000001',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // Shop Manager
  const managerEmail = process.env.MANAGER_EMAIL || 'manager@lugica.com';
  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: { passwordHash },
    create: {
      email: managerEmail,
      name: 'Shop Manager',
      phone: '+250780000002',
      passwordHash,
      role: Role.SHOP_MANAGER,
      isActive: true,
    },
  });

  // Clients
  const clients = [];
  for (let i = 1; i <= 3; i++) {
    const clientEmail = process.env[`CLIENT${i}_EMAIL`] || `client${i}@lugica.com`;
    const client = await prisma.user.upsert({
      where: { email: clientEmail },
      update: { passwordHash },
      create: {
        email: clientEmail,
        name: `Test Client ${i}`,
        phone: `+25078000001${i}`,
        passwordHash,
        role: Role.CLIENT,
        isActive: true,
      },
    });
    clients.push(client);
  }

  // Drivers
  const driverEmails = [
    process.env.DRIVER1_EMAIL || 'driver1@lugica.com',
    process.env.DRIVER2_EMAIL || 'driver2@lugica.com',
    process.env.DRIVER3_EMAIL || 'driver3@lugica.com',
  ];
  
  const drivers = [];
  for (let i = 0; i < driverEmails.length; i++) {
    const d = await prisma.user.upsert({
      where: { email: driverEmails[i] },
      update: { passwordHash, isAvailable: i % 2 === 0 },
      create: {
        email: driverEmails[i],
        name: `Test Driver ${i + 1}`,
        phone: `+25078000009${i}`,
        passwordHash,
        role: Role.DRIVER,
        isActive: true,
        licenseNumber: `DL-123456-${i}`,
        isAvailable: i % 2 === 0,
      },
    });
    drivers.push(d);
  }

  // Vehicles
  const companyVehicle = await prisma.vehicle.upsert({
    where: { plateNumber: 'RAB123A' },
    update: { assignedDriverId: drivers[0].id },
    create: {
      plateNumber: 'RAB123A',
      type: 'Truck',
      capacity: 1000,
      ownershipType: 'COMPANY',
      assignedDriverId: drivers[0].id,
    },
  });

  const individualVehicle = await prisma.vehicle.upsert({
    where: { plateNumber: 'RAB123B' },
    update: { 
      ownedByDriverId: drivers[1].id,
      assignedDriverId: drivers[1].id 
    },
    create: {
      plateNumber: 'RAB123B',
      type: 'Van',
      capacity: 500,
      ownershipType: 'INDIVIDUAL',
      ownedByDriverId: drivers[1].id,
      assignedDriverId: drivers[1].id,
    },
  });

  console.log('Seeding Categories...');
  const electronicsCat = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics' },
  });
  
  const phonesCat = await prisma.category.upsert({
    where: { name: 'Smartphones' },
    update: { parentId: electronicsCat.id },
    create: { name: 'Smartphones', parentId: electronicsCat.id },
  });

  const laptopsCat = await prisma.category.upsert({
    where: { name: 'Laptops' },
    update: { parentId: electronicsCat.id },
    create: { name: 'Laptops', parentId: electronicsCat.id },
  });

  console.log('Seeding Products...');
  const products = [];
  for (let i = 1; i <= 40; i++) {
    const isPhone = i % 2 === 0;
    const cat = isPhone ? phonesCat : laptopsCat;
    const name = isPhone ? `Smartphone Pro ${i}` : `Laptop Ultra ${i}`;
    const sku = `SKU-${isPhone ? 'PHN' : 'LAP'}-${1000 + i}`;
    
    const product = await prisma.product.upsert({
      where: { sku },
      update: {},
      create: {
        sku,
        name,
        description: `Description for ${name}`,
        categoryId: cat.id,
        priceMinorUnits: (100000 + (i * 5000)), // Prices from 100k
        stockQuantity: 50,
        searchText: `${name} ${sku} ${cat.name}`.toLowerCase(),
        status: ProductStatus.ACTIVE,
      },
    });
    products.push(product);
  }

  console.log('Seeding Suppliers and Goods Receipts...');
  const supplier1 = await prisma.supplier.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: { name: 'Global Tech Dist' },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Global Tech Dist',
      contactName: 'Alice',
      phone: '+1234567890',
    }
  });

  // Goods receipt sample
  const existingReceipts = await prisma.goodsReceipt.count({ where: { supplierId: supplier1.id } });
  if (existingReceipts === 0) {
    const receipt = await prisma.goodsReceipt.create({
      data: {
        supplierId: supplier1.id,
        deliveredByName: 'Bob Driver',
        receivedByUserId: manager.id,
        receivedAt: new Date(),
        invoiceNumber: 'INV-1001',
        items: {
          create: [
            {
              productId: products[0].id,
              quantityDelivered: 20,
              quantityAccepted: 20,
              quantityRejected: 0,
              unitCostMinorUnits: products[0].priceMinorUnits - 10000,
            },
            {
              productId: products[1].id,
              quantityDelivered: 30,
              quantityAccepted: 30,
              quantityRejected: 0,
              unitCostMinorUnits: products[1].priceMinorUnits - 10000,
            }
          ]
        }
      },
      include: { items: true },
    });

    for (const item of receipt.items) {
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: StockMovementType.RECEIPT,
          quantity: item.quantityAccepted,
          referenceType: ReferenceType.GOODS_RECEIPT_ITEM,
          referenceId: item.id,
          performedByUserId: manager.id,
          notes: 'Initial seed receipt',
        },
      });
    }
  }

  console.log('Seeding Orders...');
  const existingOrders = await prisma.order.count({ where: { clientId: clients[0].id } });
  if (existingOrders === 0) {
    await prisma.order.create({
      data: {
        clientId: clients[0].id,
        status: OrderStatus.PAID,
        totalMinorUnits: products[0].priceMinorUnits,
        currency: 'RWF',
        deliveryId: 'd0000000-0000-0000-0000-000000000004',
        customerName: 'Test Client 1',
        customerEmail: 'client1@lugica.com',
        customerPhone: '+250780000011',
        shippingAddress: 'Kigali, Rwanda',
        paymentMethod: 'CASH',
        expiresAt: new Date(Date.now() + 3600000),
        items: {
          create: [{
            productId: products[0].id,
            productNameSnapshot: products[0].name,
            unitPriceMinorUnitsSnapshot: products[0].priceMinorUnits,
            quantity: 1,
          }],
        },
      },
    });
  }

  console.log('Seeding Deliveries for Drivers...');

  const deliveryIds = {
    pending: 'd0000000-0000-0000-0000-000000000001',
    assigned: 'd0000000-0000-0000-0000-000000000002',
    pickedUp: 'd0000000-0000-0000-0000-000000000003',
    inTransit: 'd0000000-0000-0000-0000-000000000004',
    delivered: 'd0000000-0000-0000-0000-000000000005',
    cancelled: 'd0000000-0000-0000-0000-000000000006',
  };

  const deliveryBase = {
    clientId: clients[0].id,
    pickupAddress: 'Warehouse A, Kigali',
    pickupLat: -1.957,
    pickupLng: 30.088,
    dropoffAddress: 'Client Home, Kigali',
    dropoffLat: -1.960,
    dropoffLng: 30.100,
    packageDetails: '1x Electronics',
  };

  await prisma.delivery.upsert({
    where: { id: deliveryIds.pending },
    update: {},
    create: { ...deliveryBase, id: deliveryIds.pending, status: 'PENDING' }
  });

  await prisma.delivery.upsert({
    where: { id: deliveryIds.assigned },
    update: { driverId: drivers[0].id, vehicleId: companyVehicle.id, status: 'ASSIGNED' },
    create: { ...deliveryBase, id: deliveryIds.assigned, status: 'ASSIGNED', driverId: drivers[0].id, vehicleId: companyVehicle.id }
  });

  await prisma.delivery.upsert({
    where: { id: deliveryIds.pickedUp },
    update: { driverId: drivers[0].id, vehicleId: companyVehicle.id, status: 'PICKED_UP' },
    create: { ...deliveryBase, id: deliveryIds.pickedUp, status: 'PICKED_UP', driverId: drivers[0].id, vehicleId: companyVehicle.id }
  });

  await prisma.delivery.upsert({
    where: { id: deliveryIds.inTransit },
    update: { driverId: drivers[1].id, vehicleId: individualVehicle.id, status: 'IN_TRANSIT' },
    create: { ...deliveryBase, id: deliveryIds.inTransit, status: 'IN_TRANSIT', driverId: drivers[1].id, vehicleId: individualVehicle.id }
  });

  await prisma.delivery.upsert({
    where: { id: deliveryIds.delivered },
    update: { driverId: drivers[0].id, vehicleId: companyVehicle.id, status: 'DELIVERED', deliveredAt: new Date() },
    create: { ...deliveryBase, id: deliveryIds.delivered, status: 'DELIVERED', driverId: drivers[0].id, vehicleId: companyVehicle.id, deliveredAt: new Date() }
  });

  await prisma.delivery.upsert({
    where: { id: deliveryIds.cancelled },
    update: { driverId: drivers[1].id, vehicleId: individualVehicle.id, status: 'CANCELLED' },
    create: { ...deliveryBase, id: deliveryIds.cancelled, status: 'CANCELLED', driverId: drivers[1].id, vehicleId: individualVehicle.id }
  });

  await prisma.delivery.upsert({
    where: { id: 'd0000000-0000-0000-0000-000000000007' },
    update: { driverId: drivers[2].id, vehicleId: companyVehicle.id, status: 'ASSIGNED' },
    create: { ...deliveryBase, id: 'd0000000-0000-0000-0000-000000000007', status: 'ASSIGNED', driverId: drivers[2].id, vehicleId: companyVehicle.id }
  });

  console.log('Seeding Driver Locations...');
  await prisma.driverLocation.deleteMany({
    where: { deliveryId: deliveryIds.inTransit }
  });

  await prisma.driverLocation.createMany({
    data: [
      {
        driverId: drivers[1].id,
        deliveryId: deliveryIds.inTransit,
        latitude: -1.958,
        longitude: 30.089,
        recordedAt: new Date(Date.now() - 10 * 60000), // 10 mins ago
      },
      {
        driverId: drivers[1].id,
        deliveryId: deliveryIds.inTransit,
        latitude: -1.959,
        longitude: 30.095,
        recordedAt: new Date(Date.now() - 5 * 60000), // 5 mins ago
      }
    ]
  });

  console.log('Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
