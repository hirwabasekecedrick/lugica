/**
 * Reset the local dev passwords for the three accounts the smoke test needs.
 *
 * These are the seed defaults (SEED_DEFAULT_PASSWORD, api/.env). Re-running the
 * full seed would also set them, but it would duplicate goods receipts, stock
 * movements and orders, which use plain `create`. This touches only passwordHash
 * on three users and nothing else.
 */
const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");
const p = new PrismaClient();

const PASSWORD = process.env.SEED_PASSWORD || "Admin@123";
const EMAILS = ["admin@lugica.com", "driver1@gmail.com", "client1@lugica.com"];

(async () => {
  const passwordHash = await hash(PASSWORD, 12);

  const result = await p.user.updateMany({
    where: { email: { in: EMAILS } },
    data: { passwordHash },
  });

  const found = await p.user.findMany({
    where: { email: { in: EMAILS } },
    select: { email: true, role: true, isActive: true },
  });

  console.log(`updated ${result.count} user(s)`);
  console.log(JSON.stringify(found, null, 1));
})().finally(() => p.$disconnect());