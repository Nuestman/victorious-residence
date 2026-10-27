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

function getDb(): Database {
  if (!globalForDb.victoriousDb) {
    globalForDb.victoriousDb = createDb();
  }

  return globalForDb.victoriousDb;
}

/** Lazy proxy so `next build` can import modules without requiring DATABASE_URL. */
export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const value = Reflect.get(getDb(), property, receiver);
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
