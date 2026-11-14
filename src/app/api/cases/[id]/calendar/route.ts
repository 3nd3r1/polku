import { z } from "zod";
import { ActionError } from "@/server/errors";
import { calendarFor } from "@/server/schedule";

export async function GET(_request: Request, ctx: RouteContext<"/api/cases/[id]/calendar">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "Bad case id" }, { status: 400 });
  try {
    return Response.json(await calendarFor(id));
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
