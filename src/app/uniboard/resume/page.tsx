import { Suspense } from "react";
import ResumePageClient from "./ResumePageClient";

export const metadata = {
  title: "Resume",
  description: "Resume dashboard and editor",
};

export default function ResumePage() {
  return (
    <Suspense fallback={null}>
      <ResumePageClient />
    </Suspense>
  );
}
