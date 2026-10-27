import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

type Database = NeonHttpDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  victoriousDb?: Database;
};

function createDb(): Database {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return drizzle(neon(databaseUrl), { schema });
}

export const db: Database = globalForDb.victoriousDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.victoriousDb = db;
}
