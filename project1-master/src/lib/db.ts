import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: unknown };

function hasThreadDelegate(client: unknown): client is PrismaClient {
  return typeof client === "object" && client !== null && "thread" in client;
}

const cached = globalForPrisma.prisma;

if (cached && !hasThreadDelegate(cached)) {
  void (cached as PrismaClient).$disconnect().catch(() => {});
}

export const db: PrismaClient = hasThreadDelegate(cached) ? cached : new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
