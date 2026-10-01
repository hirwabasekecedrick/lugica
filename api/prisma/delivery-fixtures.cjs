/**
 * One-off: create the delivery fixtures the driver and tracking views need.
 *
 * Deliberately does NOT run `prisma db seed` — the seed's goods receipts,
 * stock movements and orders use plain `create`, so re-running it duplicates
 * rows. This creates deliveries only, and is a no-op if any already exist.
 *
 * The same fixtures are now part of prisma/seed.ts for fresh databases.
 */
const { PrismaClient, DeliveryStatus, Role } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const existing = await p.delivery.count();
  if (existing > 0) {
    console.log(`Skipped: ${existing} deliveries already present.`);
    return;
  }

  const admin = await p.user.findFirst({ where: { role: Role.ADMIN } });
  const driver = await p.user.findFirst({ where: { role: Role.DRIVER } });
  const client = await p.user.findFirst({ where: { role: Role.CLIENT } });
  const vehicle = await p.vehicle.findFirst({ where: { status: "ACTIVE" } });

  if (!admin || !driver || !client || !vehicle) {
    console.error("Missing admin/driver/client/vehicle; cannot build fixtures.");
    process.exitCode = 1;
    return;
  }

  console.log(`driver=${driver.email} vehicle=${vehicle.plateNumber} client=${client.email}`);

  const fixtures = [
    {
      status: DeliveryStatus.PENDING,
      driverId: null,
      vehicleId: null,
      dropoffAddress: "KN 5 Rd, Kigali",
      dropoffLat: -1.9441,
      dropoffLng: 30.0619,
    },
    {
      status: DeliveryStatus.ASSIGNED,
      driverId: driver.id,
      vehicleId: vehicle.id,
      dropoffAddress: "Remera, Kigali",
      dropoffLat: -1.9578,
      dropoffLng: 30.1218,
    },
    {
      status: DeliveryStatus.IN_TRANSIT,
      driverId: driver.id,
      vehicleId: vehicle.id,
      dropoffAddress: "Nyamirambo, Kigali",
      dropoffLat: -1.9826,
      dropoffLng: 30.0446,
    },
    {
      status: DeliveryStatus.DELIVERED,
      driverId: driver.id,
      vehicleId: vehicle.id,
      dropoffAddress: "Gikondo, Kigali",
      dropoffLat: -1.9789,
      dropoffLng: 30.0723,
    },
  ];

  for (const fixture of fixtures) {
    const created = await p.delivery.create({
      data: {
        clientId: client.id,
        pickupAddress: "Lugica warehouse, Kigali",
        pickupLat: -1.9497,
        pickupLng: 30.0925,
        dropoffAddress: fixture.dropoffAddress,
        dropoffLat: fixture.dropoffLat,
        dropoffLng: fixture.dropoffLng,
        status: fixture.status,
        driverId: fixture.driverId,
        vehicleId: fixture.vehicleId,
        ...(fixture.status === DeliveryStatus.DELIVERED
          ? { deliveredAt: new Date(Date.now() - 3600000) }
          : {}),
      },
    });

    if (fixture.status === DeliveryStatus.IN_TRANSIT) {
      await p.deliveryStatusHistory.createMany({
        data: [
          {
            deliveryId: created.id,
            fromStatus: DeliveryStatus.PENDING,
            toStatus: DeliveryStatus.ASSIGNED,
            changedByUserId: admin.id,
            notes: "Seeded assignment",
          },
          {
            deliveryId: created.id,
            fromStatus: DeliveryStatus.ASSIGNED,
            toStatus: DeliveryStatus.PICKED_UP,
            changedByUserId: driver.id,
            notes: "Seeded pickup",
          },
          {
            deliveryId: created.id,
            fromStatus: DeliveryStatus.PICKED_UP,
            toStatus: DeliveryStatus.IN_TRANSIT,
            changedByUserId: driver.id,
            notes: "Seeded transit",
          },
        ],
      });
    }

    console.log(`created ${fixture.status.padEnd(11)} ${created.id} -> ${fixture.dropoffAddress}`);
  }

  console.log("Done.");
})().finally(() => p.$disconnect());