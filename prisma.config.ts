import "dotenv/config";
import { defineConfig } from "prisma/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env["DATABASE_URL"]!;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // @ts-expect-error - adapter type is not natively declared in Prisma CLI defineConfig types
    adapter: new PrismaPg(new Pool({ connectionString })),
    url: connectionString,
  },
});