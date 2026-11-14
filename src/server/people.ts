import { inArray } from "drizzle-orm";
import { db } from "../db";
import { people } from "../db/schema";
import type { Person } from "../sim/people";

/** Staff-side read of the register, for people that appear in calls or cases. Not reachable by the agent. */
export async function peopleByIds(ids: string[]): Promise<Person[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  return db.select().from(people).where(inArray(people.id, unique));
}
