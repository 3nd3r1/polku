import { notFound } from "next/navigation";
import { connection } from "next/server";
import { DemoTools } from "@/components/demo-tools";

export const metadata = { title: "Polku · Demo tools" };

export default async function DemoPage() {
  await connection();
  // Production (password-locked) has no demo tools: the real phone line stands in. Reset with `npm run demo:reset prod`.
  if (process.env.SITE_PASSWORD) notFound();
  return <DemoTools />;
}
