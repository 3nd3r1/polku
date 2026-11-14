import { db } from "../db";
import { recordAccess } from "../db/schema";
import { type Holder, mayOpen, type RecordPart } from "../ontology/record";
import { ActionError } from "./errors";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Log one open or write of a patient's record. A holder can only touch the
 * parts it may open (ontology/record.ts); anything else is refused.
 */
export async function logRecord(
  caseId: string,
  holder: Holder,
  mode: "read" | "write",
  parts: RecordPart[],
  actor: string,
  tx: Tx | typeof db = db,
  at?: Date,
) {
  if (!mayOpen(holder, parts)) throw new ActionError(`${holder} may not open ${parts.join(", ")}`, 403);
  await tx.insert(recordAccess).values({ caseId, holder, mode, parts, actor, ...(at && { at }) });
}
