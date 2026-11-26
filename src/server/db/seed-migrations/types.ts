import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

import type * as schema from "../schema";

export type SeedDb = NeonHttpDatabase<typeof schema>;

export type SeedMigration = {
  id: string;
  description: string;
  up: (db: SeedDb) => Promise<void>;
};
