import { connection } from "next/server";
import { bus } from "@/server/bus";

/** Server-sent events: one "change" message whenever any case changes. Clients refetch. */
export async function GET(request: Request) {
  await connection();
  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (line: string) => controller.enqueue(encoder.encode(line));
      const onChange = () => write("data: change\n\n");
      const ping = setInterval(() => write(": ping\n\n"), 25_000);
      bus.on("change", onChange);
      write("data: ready\n\n");
      cleanup = () => {
        clearInterval(ping);
        bus.off("change", onChange);
      };
      request.signal.addEventListener("abort", () => {
        cleanup();
        controller.close();
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
