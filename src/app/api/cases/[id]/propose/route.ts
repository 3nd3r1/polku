import { z } from "zod";
import { ActionError } from "@/server/errors";
import { DEMO_SITE } from "@/demo/site";
import { ringBack } from "@/server/phone";
import { proposeTimes } from "@/server/schedule";

const Body = z.object({ times: z.array(z.iso.datetime()).min(1).max(3) });

/** The nurse proposes free times. Returns the callback call Polku makes to the patient. */
export async function POST(request: Request, ctx: RouteContext<"/api/cases/[id]/propose">) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !parsed.success) {
    return Response.json({ error: "Expected { times: ISO datetime[] }" }, { status: 400 });
  }
  try {
    const callId = await proposeTimes(id, parsed.data.times);
    // phone: true means a real phone is ringing, so the browser neither calls nor simulates.
    return Response.json({ callId, phone: DEMO_SITE ? false : await ringBack(callId) });
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
