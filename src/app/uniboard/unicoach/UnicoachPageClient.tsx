"use client";

import React, { Suspense } from "react";
import Unicoach from "@/components/Unicoach";

export default function UnicoachPageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] min-h-[40vh]">
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      }
    >
      <Unicoach />
    </Suspense>
  );
}
