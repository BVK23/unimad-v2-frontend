"use client";

import { useSubscriptionData } from "@/features/user-profile/hooks/use-profile-data";
import type { BillingHistoryRow, CurrentSubscription } from "@/features/user-profile/types";
import Link from "next/link";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function addDaysIso(startIso: string, days: number): string {
  const d = new Date(startIso);
  if (Number.isNaN(d.getTime())) return "";
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function isPartialUnicoachPlan(planId?: string | null, plan?: string | null): boolean {
  const id = (planId || "").toLowerCase();
  const label = (plan || "").toLowerCase();
  return id.includes("partial") || label.includes("partial") || label.includes("1/2") || label.includes("2/2");
}

function isFullUnicoachPlan(planId?: string | null, plan?: string | null, purchases?: string[]): boolean {
  const id = (planId || "").toLowerCase();
  if (id === "unicoach_program" || id.includes("partial_2")) return true;
  if (purchases?.some(p => /full/i.test(p))) return true;
  const label = (plan || "").toLowerCase();
  return label.includes("full");
}

function billingEndDisplay(row: BillingHistoryRow): string {
  const planId = (row as BillingHistoryRow & { plan_id?: string }).plan_id;
  if (isPartialUnicoachPlan(planId, row.plan)) {
    const end = row.end_date || (row.start_date ? addDaysIso(row.start_date, 30) : "");
    return formatDate(end);
  }
  // Full Unicoach / lifetime-style — never-ending in the UI
  if ((row.plan || "").toLowerCase().includes("unicoach") || (planId || "").startsWith("unicoach")) {
    return "—";
  }
  return formatDate(row.end_date);
}

function SubscriptionStatusCopy({
  status,
  plan,
  nextBilling,
  endingAt,
  endedAt,
  lastAction,
  isDiscovery,
}: {
  status?: string | null;
  plan?: string | null;
  nextBilling?: string | null;
  endingAt?: string | null;
  endedAt?: string | null;
  lastAction?: string | null;
  isDiscovery?: boolean;
}) {
  if (!status) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">You don&apos;t have an active subscription yet.</p>;
  }
  if (isDiscovery) {
    return (
      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
        <p>
          You&apos;re on <span className="font-semibold text-brand-600 dark:text-brand-400">Unicoach — Free discovery</span>
        </p>
        <p className="text-xs text-slate-500">Complete discovery, then upgrade to unlock the full programme.</p>
      </div>
    );
  }
  if (status === "active" || status === "payment_verified") {
    return (
      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
        <p>
          Subscribed to <span className="font-semibold text-brand-600 dark:text-brand-400">{plan}</span>
        </p>
        {status === "payment_verified" ? <p className="text-xs text-slate-500">Your payment is being processed.</p> : null}
        {nextBilling ? <p className="text-xs text-slate-500">Auto renews on {formatDate(nextBilling)}</p> : null}
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
        <p>
          <span className="font-semibold text-brand-600 dark:text-brand-400">{plan}</span> is paused — we couldn&apos;t process your
          payment.
        </p>
        <p className="text-xs text-slate-500">Check your email from Razorpay to complete payment.</p>
      </div>
    );
  }
  if (status === "cancelled") {
    return <p className="text-sm text-slate-600 dark:text-slate-300">Cancelled on {formatDate(endedAt)}</p>;
  }
  if (endingAt && lastAction?.includes("Cancellation initiated")) {
    return <p className="text-sm text-slate-600 dark:text-slate-300">Your subscription ends on {formatDate(endingAt)}</p>;
  }
  return (
    <p className="text-sm text-slate-600 dark:text-slate-300">
      Status: <span className="font-medium capitalize">{status.replace(/_/g, " ")}</span>
    </p>
  );
}

function planBannerTitle(current?: CurrentSubscription | null): string {
  if (!current) return "Free";
  if (current.is_discovery || current.plan_id === "vsl_discovery") return "Unicoach";
  if (
    current.plan?.toLowerCase().includes("unicoach") ||
    (current.plan_id ?? "").startsWith("unicoach") ||
    current.plan_id === "vsl_discovery"
  ) {
    return "Unicoach";
  }
  return current.plan ?? "Free";
}

export function UserSubscriptionPanel() {
  const { data, isLoading, isError } = useSubscriptionData();
  const current = data?.current_subscription as (CurrentSubscription & { is_discovery?: boolean }) | null | undefined;
  const history = data?.billing_history ?? [];
  const isDiscovery = Boolean(current?.is_discovery || current?.plan_id === "vsl_discovery");
  const isUnicoach = isDiscovery || current?.plan?.toLowerCase().includes("unicoach") || (current?.plan_id ?? "").startsWith("unicoach");
  const unicoachPurchases = current?.unicoach_purchases ?? [];
  const unicoachModules = current?.unicoach_modules ?? [];
  const subscribedLabel = isDiscovery
    ? "Free discovery"
    : isFullUnicoachPlan(current?.plan_id, current?.plan, unicoachPurchases)
      ? "Full program"
      : (current?.plan ?? "Unicoach");

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111]">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Current plan</h2>
        {isLoading ? (
          <div className="mt-4 h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : isError ? (
          <p className="mt-3 text-sm text-red-600">Could not load subscription data.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-600 px-4 py-4 text-white">
              <div>
                <p className="text-[10px] uppercase tracking-wide opacity-80">Plan</p>
                <p className="text-lg font-semibold">{planBannerTitle(current)}</p>
              </div>
              {isUnicoach ? (
                <Link
                  href="/uniboard/unicoach"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/50 bg-transparent px-5 py-2.5 text-xs font-medium text-white transition-all hover:bg-white/10 active:scale-95"
                >
                  Go to Unicoach
                </Link>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/50 bg-transparent px-5 py-2.5 text-xs font-medium text-white opacity-60"
                  disabled
                >
                  Subscribe (coming soon)
                </button>
              )}
            </div>
            <SubscriptionStatusCopy
              status={current?.status}
              plan={subscribedLabel}
              nextBilling={current?.next_billing_date}
              endingAt={current?.ending_at}
              endedAt={current?.ended_at}
              lastAction={current?.last_action ?? undefined}
              isDiscovery={isDiscovery}
            />
            {isUnicoach && (unicoachPurchases.length > 0 || unicoachModules.length > 0) ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Your Unicoach purchases
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                  {(unicoachPurchases.length > 0 ? unicoachPurchases : unicoachModules).map(item => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Payment issues? Contact{" "}
              <a href="mailto:finance@unimad.ai" className="text-brand-600 dark:text-brand-400">
                finance@unimad.ai
              </a>
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111]">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Billing history</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4 font-medium">Start</th>
                <th className="py-2 pr-4 font-medium">End</th>
                <th className="py-2 pr-4 font-medium">Details</th>
                <th className="py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500 dark:text-slate-400">
                    Your billing history will appear here.
                  </td>
                </tr>
              ) : (
                history.map((row, i) => (
                  <tr key={`${row.start_date}-${i}`} className="border-b border-slate-50 dark:border-slate-800/80">
                    <td className="py-2.5 pr-4 text-slate-700 dark:text-slate-200">{formatDate(row.start_date)}</td>
                    <td className="py-2.5 pr-4 text-slate-700 dark:text-slate-200">{billingEndDisplay(row)}</td>
                    <td className="py-2.5 pr-4 text-slate-700 dark:text-slate-200">{row.plan}</td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-200">
                      {row.plan?.includes("Unicoach") ? "£" : "$"}
                      {row.amount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
