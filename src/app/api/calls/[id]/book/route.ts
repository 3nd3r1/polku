import { z } from "zod";
import { ActionError } from "@/server/errors";
import { bookTime } from "@/server/schedule";

const Body = z.object({ option: z.coerce.number().int() });

/** The book_time tool: the identified caller picks one of the times the nurse proposed (0 = none suits). */
export async function POST(request: Request, ctx: RouteContext<"/api/calls/[id]/book">) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !parsed.success) {
    return Response.json({ error: "Expected { option: number }" }, { status: 400 });
  }
  try {
    return Response.json(await bookTime(id, parsed.data.option));
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
