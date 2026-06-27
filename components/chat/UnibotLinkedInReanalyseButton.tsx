"use client";

import { LINKEDIN_REANALYZE_EVENT } from "@/src/features/linkedin/constants";
import { RefreshCw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const LINKEDIN_PAGE_PREFIX = "/uniboard/linkedin";

type Props = {
  onBlocked?: () => void;
};

export function UnibotLinkedInReanalyseButton({ onBlocked }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const onLinkedInPage = pathname?.startsWith(LINKEDIN_PAGE_PREFIX) ?? false;

  const handleClick = () => {
    if (!onLinkedInPage) {
      onBlocked?.();
      router.push(LINKEDIN_PAGE_PREFIX);
      return;
    }
    window.dispatchEvent(new CustomEvent(LINKEDIN_REANALYZE_EVENT));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 text-[12px] font-medium text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-slate-900 dark:text-brand-300 dark:hover:bg-brand-950/40"
    >
      <RefreshCw size={13} aria-hidden />
      {onLinkedInPage ? "Re-analyse profile photo" : "Go to LinkedIn to re-analyse"}
    </button>
  );
}
