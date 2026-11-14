import { z } from "zod";
import { ActionError, applyCaseAction, CaseAction } from "@/server/cases";

const Body = z.object({ action: CaseAction, notes: z.string().max(2000).optional() });

export async function POST(request: Request, ctx: RouteContext<"/api/cases/[id]">) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !parsed.success) {
    return Response.json({ error: "Expected { action: confirm | advance | dismiss }" }, { status: 400 });
  }
  try {
    await applyCaseAction(id, parsed.data.action, parsed.data.notes);
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
