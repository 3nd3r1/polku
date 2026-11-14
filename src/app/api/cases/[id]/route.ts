import { z } from "zod";
import { ActionError, applyCaseAction, bookRecommended, CaseAction, confirmOffer, offerSlot } from "@/server/cases";

const Body = z.union([
  z.object({ action: CaseAction, notes: z.string().max(2000).optional() }),
  // offer: SMS the recommended slot · reply: the patient's YES (simulated) · book: staff book the recommended slot
  z.object({ action: z.enum(["offer", "reply", "book"]) }),
]);

export async function POST(request: Request, ctx: RouteContext<"/api/cases/[id]">) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !parsed.success) {
    return Response.json({ error: "Expected { action: confirm | advance | dismiss | offer | reply | book }" }, { status: 400 });
  }
  try {
    const b = parsed.data;
    if (b.action === "offer") await offerSlot(id);
    else if (b.action === "reply") await confirmOffer(id);
    else if (b.action === "book") await bookRecommended(id);
    else await applyCaseAction(id, b.action, "notes" in b ? b.notes : undefined);
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
