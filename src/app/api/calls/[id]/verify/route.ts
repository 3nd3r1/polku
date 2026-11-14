import { z } from "zod";
import { ActionError } from "@/server/errors";
import { verifyIdentity } from "@/server/identity";

const Body = z.object({ hetu: z.string().max(40) });

/** The verify_identity tool: the caller's spoken identity code, then simulated Mobile ID. */
export async function POST(request: Request, ctx: RouteContext<"/api/calls/[id]/verify">) {
  const { id } = await ctx.params;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !body.success) {
    return Response.json({ error: "Expected { hetu }. Ask the caller for their personal identity code." }, { status: 400 });
  }
  try {
    return Response.json(await verifyIdentity(id, body.data.hetu));
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
