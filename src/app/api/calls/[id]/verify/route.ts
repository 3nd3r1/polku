import { z } from "zod";
import { verifyIdentity } from "@/server/calls";
import { ActionError } from "@/server/cases";

const Body = z.object({ personId: z.string().optional() }).catch({});

/** The verify_identity tool. Simulated Mobile ID; see docs/product.md. */
export async function POST(request: Request, ctx: RouteContext<"/api/calls/[id]/verify">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "Bad call id" }, { status: 400 });
  const body = Body.parse(await request.json().catch(() => ({})));
  try {
    return Response.json(await verifyIdentity(id, body.personId));
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
