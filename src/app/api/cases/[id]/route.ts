import { z } from "zod";
import { ActionError, applyCaseAction, bookSlot, CaseAction } from "@/server/cases";

const Body = z.union([
  z.object({ action: CaseAction, notes: z.string().max(2000).optional() }),
  z.object({ action: z.literal("book"), slotId: z.string() }),
]);

export async function POST(request: Request, ctx: RouteContext<"/api/cases/[id]">) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !parsed.success) {
    return Response.json({ error: "Expected { action, notes? } or { action: book, slotId }" }, { status: 400 });
  }
  try {
    const b = parsed.data;
    if (b.action === "book") await bookSlot(id, b.slotId);
    else await applyCaseAction(id, b.action, b.notes);
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
