import { connection } from "next/server";
import { Suspense } from "react";
import { CallScreen } from "@/components/call-screen";
import { PHONE_LINE, phoneConfig } from "@/server/phone";

export default function CallsPage() {
  return (
    <Suspense>
      <Calls />
    </Suspense>
  );
}

/** The real phone line, where one is set up (production): its number and a "Call me" button. */
async function Calls() {
  await connection();
  return <CallScreen line={phoneConfig() ? PHONE_LINE : null} />;
}
