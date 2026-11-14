import { DemoTools } from "@/components/demo-tools";

export const metadata = { title: "Polku · Demo tools" };

/** Linked from the nav only on the demo site and in development. On production, open /demo directly. */
export default function DemoPage() {
  return <DemoTools />;
}
