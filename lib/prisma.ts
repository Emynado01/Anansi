import { Prisma, PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const log: Prisma.PrismaClientOptions["log"] =
  process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error", "warn"];

const prisma = global.prisma ?? new PrismaClient({ log });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
