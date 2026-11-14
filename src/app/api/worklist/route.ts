import { connection } from "next/server";
import { worklist } from "@/server/schedule";

/** The nurse's patients to book, most urgent first. */
export async function GET() {
  await connection();
  return Response.json(await worklist());
}
