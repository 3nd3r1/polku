import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DemoTools } from "@/components/demo-tools";

export const metadata = { title: "Polku · Demo tools" };

export default function DemoPage() {
  return (
    <Suspense>
      <Gate />
    </Suspense>
  );
}

/** Production (password-locked) has no demo tools: "Call me" on the Calls screen rings the real line. */
async function Gate() {
  await connection();
  if (process.env.SITE_PASSWORD) notFound();
  return <DemoTools />;
}
