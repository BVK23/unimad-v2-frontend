"use client";

import { coachActAsDisplayLabel, type CoachActAsSession } from "@/constants/coach-act-as";
import { clearCoachActAsSession } from "@/lib/authed-fetch";
import { useRouter } from "next/navigation";

type CoachActAsNavControlsProps = {
  session: CoachActAsSession;
  studentPictureUrl?: string | null;
  coachPictureUrl?: string | null;
  coachDisplayName?: string | null;
};

function ProfileAvatar({
  pictureUrl,
  fallbackLetter,
  ringClassName = "border-brand-500",
}: {
  pictureUrl?: string | null;
  fallbackLetter: string;
  ringClassName?: string;
}) {
  return (
    <div className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 bg-slate-100 dark:bg-slate-800 ${ringClassName}`}>
      {pictureUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pictureUrl} alt="" className="h-full w-full object-cover" width={32} height={32} />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-brand-600">{fallbackLetter}</span>
      )}
    </div>
  );
}

export function CoachActAsNavControls({ session, studentPictureUrl, coachPictureUrl, coachDisplayName }: CoachActAsNavControlsProps) {
  const router = useRouter();
  const label = coachActAsDisplayLabel(session.studentDisplayName);
  const coachInitial = (coachDisplayName?.trim() || "C").charAt(0).toUpperCase();

  const handleExit = async () => {
    console.info("[coach-act-as] exit clicked", session);
    await clearCoachActAsSession();
    router.push("/uniboard/unicoach/coach");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-xs font-medium text-brand-700 dark:text-brand-300 sm:inline">Viewing {label}</span>
      <ProfileAvatar pictureUrl={studentPictureUrl} fallbackLetter={session.studentDisplayName.charAt(0).toUpperCase()} />
      <button
        type="button"
        onClick={() => void handleExit()}
        className="rounded-full border border-brand-500/40 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-400/40 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
      >
        Back to my profile
      </button>
      <ProfileAvatar pictureUrl={coachPictureUrl} fallbackLetter={coachInitial} ringClassName="border-slate-300 dark:border-slate-600" />
    </div>
  );
}
