import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prismaClientSingleton = () => new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.xntnjamehgqoqwcknhjf:TiChef20262@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1",
    },
  },
});

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

