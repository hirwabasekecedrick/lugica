import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const driver = await prisma.user.findUnique({ where: { email: 'driver@lugica.com' } });
  const client = await prisma.user.findFirst({ where: { email: 'client1@lugica.com' } });
  const vehicle = await prisma.vehicle.findFirst();

  if (driver && client && vehicle) {
    const d = await prisma.delivery.create({
      data: {
        clientId: client.id,
        driverId: driver.id,
        vehicleId: vehicle.id,
        pickupAddress: 'Warehouse A',
        pickupLat: -1.9441,
        pickupLng: 30.0619,
        dropoffAddress: 'Client Home',
        dropoffLat: -1.9536,
        dropoffLng: 30.0605,
        status: 'ASSIGNED',
        packageDetails: 'Test package',
      }
    });
    console.log('Delivery created:', d.id);
  } else {
    console.log('Missing deps', { driver: !!driver, client: !!client, vehicle: !!vehicle });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
