import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lugica.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  console.log(`Checking if admin user exists...`);
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (existingAdmin) {
    console.log(`Admin user already exists with email: ${existingAdmin.email}`);
    return;
  }

  console.log(`Creating default admin user...`);
  const passwordHash = await hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'System Admin',
      phone: '+250000000000',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log(`Admin user created!`);
  console.log(`Email: ${admin.email}`);
  console.log(`Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
