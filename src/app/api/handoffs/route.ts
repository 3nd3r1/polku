import { connection } from "next/server";
import { listHandoffs } from "@/server/handoffs";

/** One line per patient: who has them now, the handoff deadline, what each step opened. */
export async function GET() {
  await connection();
  return Response.json(await listHandoffs());
}
