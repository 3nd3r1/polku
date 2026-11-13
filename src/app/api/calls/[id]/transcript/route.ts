import { z } from "zod";
import { appendTranscript } from "@/server/calls";
import { ActionError } from "@/server/cases";

const Body = z.object({ role: z.enum(["agent", "caller"]), text: z.string().min(1).max(2000) });

export async function POST(request: Request, ctx: RouteContext<"/api/calls/[id]/transcript">) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !parsed.success) {
    return Response.json({ error: "Expected { role: agent | caller, text }" }, { status: 400 });
  }
  try {
    await appendTranscript(id, parsed.data.role, parsed.data.text);
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
