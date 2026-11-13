import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { polkuSql?: ReturnType<typeof postgres> };

// One pool per process, reused across dev hot reloads.
const sql = (globalForDb.polkuSql ??= postgres(process.env.DATABASE_URL!, { max: 5 }));

export const db = drizzle(sql, { schema });
export type Db = typeof db;
