import { z } from "zod";
import { ActionError } from "@/server/errors";
import { bookByNurse } from "@/server/schedule";

const Body = z.object({ at: z.iso.datetime() });

/** The nurse called the patient themselves and books the agreed time. */
export async function POST(request: Request, ctx: RouteContext<"/api/cases/[id]/book">) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !parsed.success) {
    return Response.json({ error: "Expected { at: ISO datetime }" }, { status: 400 });
  }
  try {
    await bookByNurse(id, parsed.data.at);
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
