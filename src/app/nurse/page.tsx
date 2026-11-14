import { Suspense } from "react";
import { NurseInbox } from "@/components/nurse-inbox";

export const metadata = { title: "Polku · Nurse" };

export default function NursePage() {
  return (
    <Suspense>
      <NurseInbox />
    </Suspense>
  );
}
