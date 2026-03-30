import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prismaClientSingleton = () => new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:TiChef20262@db.xntnjamehgqoqwcknhjf.supabase.co:5432/postgres",
    },
  },
});

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

