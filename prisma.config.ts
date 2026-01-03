import "dotenv/config";
import { defineConfig } from "prisma/config";

const localDatabaseUrl =
  process.env.LOCAL_DATABASE_URL ?? "file:./dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: localDatabaseUrl,
  },
});
