import { z } from "zod";
import { endCall } from "@/server/calls";
import { ActionError } from "@/server/errors";

export async function POST(_request: Request, ctx: RouteContext<"/api/calls/[id]/end">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "Bad call id" }, { status: 400 });
  try {
    await endCall(id);
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
