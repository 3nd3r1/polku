import { connection } from "next/server";
import { listCalls, startCall } from "@/server/calls";

export async function GET() {
  await connection();
  return Response.json(await listCalls());
}

/** A call connects. Returns the id the agent's tools use for the rest of the call. */
export async function POST() {
  return Response.json({ callId: await startCall() });
}
