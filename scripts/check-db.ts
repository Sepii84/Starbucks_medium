import { PrismaClient } from "@prisma/client";
import * as nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is missing or PostgreSQL is not reachable.\n" +
        "Create `.env` in the project root and add a valid PostgreSQL connection string."
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    await connectWithRetry(prisma);

    const users = await prisma.user.count();
    const categories = await prisma.menuCategory.count();
    const menuItems = await prisma.menuItem.count();
    const availableMenuItems = await prisma.menuItem.count({
      where: { isAvailable: true }
    });
    const featuredMenuItems = await prisma.menuItem.count({
      where: { isFeatured: true }
    });

    console.log("Database connected successfully.");
    console.log(`Users: ${users}`);
    console.log(`Menu categories: ${categories}`);
    console.log(`Menu items: ${menuItems}`);
    console.log(`Available menu items: ${availableMenuItems}`);
    console.log(`Featured menu items: ${featuredMenuItems}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("does not exist in the current database")) {
      console.error(
        "Database connected successfully, but the Prisma schema has not been migrated.\n" +
          "Run `npm run prisma:migrate`, then `npm run prisma:seed`, then `npm run db:check`."
      );
      console.error(`Details: ${message}`);
      process.exit(1);
    }

    console.error(
      "DATABASE_URL is missing or PostgreSQL is not reachable.\n" +
        "Create `.env` in the project root and add a valid PostgreSQL connection string."
    );

    if (message) {
      console.error(`Details: ${message}`);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

async function connectWithRetry(prisma: PrismaClient) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await prisma.$connect();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  }

  throw lastError;
}
