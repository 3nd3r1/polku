import { z } from "zod";
import { getCase } from "@/server/cases";
import { ActionError } from "@/server/errors";

/** The get_case tool. No parameters: it can only ever return the identified caller's own case. */
export async function POST(_request: Request, ctx: RouteContext<"/api/calls/[id]/case">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "Bad call id" }, { status: 400 });
  try {
    return Response.json(await getCase(id));
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
