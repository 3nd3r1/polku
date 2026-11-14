import { DEMO_SITE } from "@/demo/site";
import { ringInbound } from "@/server/phone";

/** Demo: Polku rings DEMO_CALLBACK_NUMBER and runs a normal inbound call on it. Behind the site password. */
export async function POST() {
  if (DEMO_SITE) return Response.json({ error: "No phone line on the demo site" }, { status: 404 });
  const callId = await ringInbound();
  if (!callId) return Response.json({ error: "Could not ring the phone. Check the phone line settings and the server log." }, { status: 503 });
  return Response.json({ callId });
}
