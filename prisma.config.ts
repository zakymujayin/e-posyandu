import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

config(); // loads .env
config({ path: ".env.local", override: true }); // .env.local overrides

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Create .env or .env.local file.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // @ts-expect-error - adapter type is not natively declared in Prisma CLI defineConfig types
    adapter: new PrismaPg(new Pool({ connectionString })),
    url: connectionString,
  },
});