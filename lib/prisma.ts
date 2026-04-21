import { Prisma, PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const log: Prisma.PrismaClientOptions["log"] =
  process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error", "warn"];

let client: PrismaClient | undefined;

const getPrismaClient = () => {
  if (client) return client;

  client = global.prisma ?? new PrismaClient({ log });

  if (process.env.NODE_ENV !== "production") {
    global.prisma = client;
  }

  return client;
};

const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const resolvedClient = getPrismaClient();
    const value = Reflect.get(resolvedClient, property, resolvedClient);
    return typeof value === "function" ? value.bind(resolvedClient) : value;
  },
});

export default prisma;
