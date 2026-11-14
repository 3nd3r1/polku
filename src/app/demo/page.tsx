import { notFound } from "next/navigation";
import { connection } from "next/server";
import { DemoTools } from "@/components/demo-tools";

export const metadata = { title: "Polku · Demo tools" };

export default async function DemoPage() {
  await connection();
  // Production (password-locked) has no demo tools: "Call me" on the Calls screen rings the real line.
  if (process.env.SITE_PASSWORD) notFound();
  return <DemoTools />;
}
