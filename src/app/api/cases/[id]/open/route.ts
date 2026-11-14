import { z } from "zod";
import { ActionError } from "@/server/errors";
import { openTask } from "@/server/handoffs";

/** The nurse opened this task. Logged in the record access log. */
export async function POST(_request: Request, ctx: RouteContext<"/api/cases/[id]/open">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "Bad case id" }, { status: 400 });
  try {
    await openTask(id);
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
