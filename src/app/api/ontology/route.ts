import { connection } from "next/server";
import { buildGraph } from "@/ontology/graph";
import { listCalls } from "@/server/calls";
import { listCases } from "@/server/cases";
import { PEOPLE } from "@/sim/people";

/** The whole instance graph: care data, pathway definition and live cases. */
export async function GET() {
  await connection();
  return Response.json(buildGraph(PEOPLE, await listCalls(100), await listCases(200)));
}
