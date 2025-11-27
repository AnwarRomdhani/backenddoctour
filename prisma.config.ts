// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "@prisma/config";

if (!process.env.DATABASE_URL) {
  throw new Error("Please define DATABASE_URL in your .env file");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  // That's it! Nothing else goes here.
});