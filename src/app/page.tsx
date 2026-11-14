import { connection } from "next/server";
import { CallScreen } from "@/components/call-screen";
import { PHONE_LINE, phoneConfig } from "@/server/phone";

export default async function CallsPage() {
  await connection();
  // The real phone line, where one is set up (production): its number and a "Call me" button.
  return <CallScreen line={phoneConfig() ? PHONE_LINE : null} />;
}
