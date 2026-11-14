import { connection } from "next/server";
import { buildGraph } from "@/ontology/graph";
import { listCalls } from "@/server/calls";
import { listCases } from "@/server/cases";
import { peopleByIds } from "@/server/people";

/** The whole instance graph: care data, pathway definition and live cases. */
export async function GET() {
  await connection();
  const [calls, cases] = await Promise.all([listCalls(100), listCases(200)]);
  const ids = [...calls.flatMap((c) => (c.person ? [c.person.id] : [])), ...cases.flatMap((c) => (c.person ? [c.person.id] : []))];
  return Response.json(buildGraph(await peopleByIds(ids), calls, cases));
}
