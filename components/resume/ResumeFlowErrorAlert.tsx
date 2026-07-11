import type { ResumeFlowErrorCode } from "@/features/resume/utils/resume-flow-errors";
import { AlertCircle } from "lucide-react";

type ResumeFlowErrorAlertProps = {
  message: string;
  code?: ResumeFlowErrorCode;
  className?: string;
};

export default function ResumeFlowErrorAlert({ message, code, className = "" }: ResumeFlowErrorAlertProps) {
  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
        <div className="space-y-2">
          <p>{message}</p>
          {code ? (
            <p className="text-xs text-amber-800/90 dark:text-amber-200/80">
              Reference code: <span className="font-mono font-medium tracking-tight">{code}</span>
              <span className="block pt-0.5 text-[11px] font-normal opacity-90">
                Share this code with Unimad support if the problem continues.
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
