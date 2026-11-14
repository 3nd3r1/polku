import { z } from "zod";
import { ActionError } from "@/server/errors";
import { identify } from "@/server/cases";

const Body = z.object({ hetu: z.string().max(40) });

/** The verify_identity tool: the caller's spoken identity code, simulated Mobile ID, then their own case. */
export async function POST(request: Request, ctx: RouteContext<"/api/calls/[id]/verify">) {
  const { id } = await ctx.params;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !body.success) {
    return Response.json({ error: "Expected { hetu }. Ask the caller for their personal identity code." }, { status: 400 });
  }
  try {
    return Response.json(await identify(id, body.data.hetu));
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
