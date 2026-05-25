"use client";

import React, { Suspense } from "react";
import Unicoach from "@/components/Unicoach";

export default function UnicoachCoachPageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]">
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      }
    >
      <Unicoach />
    </Suspense>
  );
}
