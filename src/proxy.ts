import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Locks the whole site behind one shared password when SITE_PASSWORD is set
 * (production, so a stranger with the link cannot start voice calls). The
 * browser asks once with its own sign-in box; any user name works. Not set
 * on the public demo site or in local development.
 *
 * /api/admin/reset is left out: it carries its own bearer token in the same
 * header and checks it itself.
 */
export function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const [scheme, encoded] = (request.headers.get("authorization") ?? "").split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString();
    const given = Buffer.from(decoded.slice(decoded.indexOf(":") + 1));
    const want = Buffer.from(password);
    if (given.length === want.length && timingSafeEqual(given, want)) return NextResponse.next();
  }
  return new NextResponse("Password required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Polku", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/((?!api/admin/reset).*)"] };
