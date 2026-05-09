import { Suspense } from "react";
import StudioPageClient from "./StudioPageClient";

export const metadata = {
  title: "Studio",
  description: "Content creation and scheduling",
};

export default function StudioPage() {
  return (
    <Suspense fallback={<div>Loading Studio...</div>}>
      <StudioPageClient />
    </Suspense>
  );
}
