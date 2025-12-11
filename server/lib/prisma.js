import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL, // Prisma 7 requires this!
});
