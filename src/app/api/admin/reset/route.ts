import { timingSafeEqual } from "node:crypto";
import { resetDemo } from "@/db/demo";
import { publishChange } from "@/server/bus";

/**
 * Resets the deployed demo to its seeded state (before recording, before peer
 * review). Needs ADMIN_TOKEN as a bearer token; without ADMIN_TOKEN set the
 * endpoint does not exist. Run with `npm run demo:reset`.
 */
export async function POST(request: Request) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return new Response(null, { status: 404 });
  const given = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "");
  const want = Buffer.from(token);
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { people, cases } = await resetDemo();
  publishChange();
  return Response.json({ people: people.length, cases });
}
