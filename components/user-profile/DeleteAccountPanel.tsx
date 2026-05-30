"use client";

import { btnOutline } from "@/constants/ui/button-classes";
import { useProfileData } from "@/features/user-profile/hooks/use-profile-data";
import { Mail, Trash2 } from "lucide-react";

const DELETE_EMAIL = "grow@unimad.ai";

export function DeleteAccountPanel() {
  const { data: profile } = useProfileData();
  const email = profile?.email ?? "";
  const name = profile?.name ?? "";

  const mailtoHref = `mailto:${DELETE_EMAIL}?subject=${encodeURIComponent("Account deletion request")}&body=${encodeURIComponent(
    `Hi Unimad team,\n\nI would like to request deletion of my Unimad account.\n\nName: ${name}\nEmail: ${email}\n\nPlease process this within 7 business days.\n\nThank you.`
  )}`;

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/30 p-5 dark:border-red-900/40 dark:bg-red-950/10">
      <div className="flex items-start gap-3">
        <Trash2 className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" size={20} />
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Delete account</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              To delete your account and associated data, send a request to our team. We process deletion requests within{" "}
              <strong>7 business days</strong>.
            </p>
          </div>
          <a
            href={mailtoHref}
            className={`${btnOutline} inline-flex !text-red-700 !border-red-200 hover:!bg-red-50 dark:!border-red-900/50`}
          >
            <Mail size={16} />
            Request account deletion
          </a>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Email opens to <span className="font-medium">{DELETE_EMAIL}</span> with your details pre-filled. Our founder will confirm once
            processing starts.
          </p>
        </div>
      </div>
    </section>
  );
}
