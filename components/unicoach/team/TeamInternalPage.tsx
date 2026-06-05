"use client";

import { useCallback, useEffect, useState } from "react";
import { useShowToast } from "@/components/onboarding/shared/Toast";
import { ProfileConfirmDialog } from "@/components/user-profile/ProfileConfirmDialog";
import type { TeamCoupon, TeamSalesDashboard } from "@/features/unicoach/api/public-unicoach-client";
import {
  getTeamSalesDashboard,
  teamCreateCoupon,
  teamDeleteCoupon,
  teamExpireCoupon,
  teamPreviewCouponCode,
  teamResolveUnicoachClaim,
  teamSearchUsers,
} from "@/features/unicoach/server-actions/team-sales-actions";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const PERIOD_OPTIONS = [
  { value: "day", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "30 days" },
  { value: "all", label: "All time" },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  webinar: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  referral: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  sales: "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  reel: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  other: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const DEFAULT_CATEGORIES = [
  { value: "webinar", label: "Webinar" },
  { value: "referral", label: "Referral" },
  { value: "sales", label: "Sales" },
  { value: "reel", label: "Reel" },
  { value: "other", label: "Other" },
];

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TeamInternalPage() {
  const router = useRouter();
  const toast = useShowToast();
  const [period, setPeriod] = useState<(typeof PERIOD_OPTIONS)[number]["value"]>("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [data, setData] = useState<TeamSalesDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimsOpen, setClaimsOpen] = useState(false);

  const dashboardFilters = useCustomRange && dateFrom && dateTo ? { dateFrom, dateTo } : { period };

  const loadDashboard = useCallback(
    async (filters: { period?: string; dateFrom?: string; dateTo?: string }, { silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      try {
        const result = await getTeamSalesDashboard(filters);
        setData(result);
        if ((result.unclaimed_purchases?.length ?? 0) > 0) {
          setClaimsOpen(true);
        }
        return result;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to load dashboard");
        router.push("/uniboard/resume");
        throw err;
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [router, toast]
  );

  useEffect(() => {
    if (useCustomRange && (!dateFrom || !dateTo)) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    getTeamSalesDashboard(dashboardFilters)
      .then(result => {
        if (cancelled) return;
        setData(result);
        if ((result.unclaimed_purchases?.length ?? 0) > 0) {
          setClaimsOpen(true);
        }
      })
      .catch(err => {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "Unable to load dashboard");
        router.push("/uniboard/resume");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [period, dateFrom, dateTo, useCustomRange]);

  const refreshDashboard = () => {
    void loadDashboard(dashboardFilters, { silent: true }).catch(err =>
      toast.error(err instanceof Error ? err.message : "Failed to refresh")
    );
  };

  if (loading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const stats = data?.stats;
  const activeCoupons = data?.coupons?.active ?? [];
  const recentlyExpired = data?.coupons?.recently_expired ?? [];
  const categories = data?.coupon_categories?.length ? data.coupon_categories : DEFAULT_CATEGORIES;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-brand-600 dark:text-brand-400 font-medium">Unimad Internal</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">Team dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">UniCoach sales, coupons, and claim resolution</p>
        </div>
        <PeriodFilter
          period={period}
          onChange={value => {
            setUseCustomRange(false);
            setPeriod(value);
          }}
          useCustomRange={useCustomRange}
          onToggleCustom={() => setUseCustomRange(open => !open)}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
        />
      </div>

      <p className="text-xs text-slate-500 -mt-4">All amounts in GBP · Payment links sourced from Razorpay webhooks (TracerPay)</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="In-app (signed users)"
          count={stats?.in_app?.count}
          total={stats?.in_app?.total_gbp}
          subtitle="Checkout inside the product"
        />
        <StatCard
          title="Public page"
          count={stats?.public_page?.count}
          total={stats?.public_page?.total_gbp}
          subtitle={`${stats?.public_page?.fulfilled_count ?? 0} fulfilled · ${stats?.public_page?.awaiting_claim_count ?? 0} awaiting claim`}
        />
        <StatCard
          title="Payment links"
          count={stats?.payment_links?.count}
          total={stats?.payment_links?.total_gbp}
          subtitle="Razorpay / TracerPay links (no product order)"
        />
        <StatCard title="Combined total" count={stats?.combined_count} total={stats?.combined_total_gbp} highlight />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Full payments" count={stats?.payment_types?.full_count} subtitle="All channels combined" />
        <StatCard title="Partial payments" count={stats?.payment_types?.partial_count} subtitle="All channels combined" />
      </div>

      <CreateCouponSection categories={categories} onCreated={refreshDashboard} toast={toast} />

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-5 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-3">Active coupons</h2>
        {activeCoupons.length === 0 ? (
          <p className="text-sm text-slate-500">No active coupons</p>
        ) : (
          <ul className="space-y-2">
            {activeCoupons.map(coupon => (
              <CouponRow key={coupon.id} coupon={coupon} onUpdated={refreshDashboard} showExpire toast={toast} />
            ))}
          </ul>
        )}
      </section>

      {recentlyExpired.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-5">
          <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Recently expired</h2>
          <p className="text-xs text-slate-500 mb-3">Expired in the last 7 days</p>
          <ul className="space-y-2">
            {recentlyExpired.map(coupon => (
              <CouponRow key={coupon.id} coupon={coupon} onUpdated={refreshDashboard} muted showDelete toast={toast} />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] overflow-hidden shadow-sm">
        <button
          type="button"
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          onClick={() => setClaimsOpen(open => !open)}
        >
          <div>
            <h2 className="text-lg font-medium text-slate-900 dark:text-white">Unclaimed payments</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {(data?.unclaimed_purchases ?? []).length} payment(s) awaiting manual assignment
            </p>
          </div>
          {claimsOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
        </button>

        {claimsOpen ? (
          <div className="border-t border-slate-100 dark:border-slate-800">
            {(data?.unclaimed_purchases ?? []).length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">No unclaimed payments right now.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-left">
                    <tr>
                      <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">Paid at</th>
                      <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">Type</th>
                      <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">Email</th>
                      <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">Phone</th>
                      <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">Amount</th>
                      <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 min-w-[280px]">Assign to user</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.unclaimed_purchases?.map(row => (
                      <UnclaimedRow key={row.claim_token} row={row} onAssigned={refreshDashboard} toast={toast} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function PeriodFilter({
  period,
  onChange,
  useCustomRange,
  onToggleCustom,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: {
  period: string;
  onChange: (value: (typeof PERIOD_OPTIONS)[number]["value"]) => void;
  useCustomRange: boolean;
  onToggleCustom: () => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-[#111]">
        {PERIOD_OPTIONS.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 text-sm transition-colors ${
              !useCustomRange && period === option.value
                ? "bg-brand-600 text-white"
                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onToggleCustom}
          className={`px-3 py-1.5 text-sm transition-colors border-l border-slate-200 dark:border-slate-700 ${
            useCustomRange ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          Custom
        </button>
      </div>
      {useCustomRange ? (
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={dateFrom}
            onChange={e => onDateFromChange(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-[#0a0a0a]"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => onDateToChange(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-[#0a0a0a]"
          />
        </div>
      ) : null}
    </div>
  );
}

function CreateCouponSection({
  categories,
  onCreated,
  toast,
}: {
  categories: Array<{ value: string; label: string }>;
  onCreated: () => void;
  toast: ReturnType<typeof useShowToast>;
}) {
  const [category, setCategory] = useState("sales");
  const [code, setCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState("30");
  const [purpose, setPurpose] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerateCode = async () => {
    try {
      setGenerating(true);
      const result = await teamPreviewCouponCode(category);
      setCode(result.code || "");
      toast.success("Code generated — review and click Create coupon to save it");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      toast.error("Enter a coupon code or generate one first");
      return;
    }
    try {
      setCreating(true);
      await teamCreateCoupon({
        category,
        code: trimmedCode,
        discount_amount: Number(discountAmount),
        purpose: purpose.trim() || undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      toast.success("Coupon created");
      setCode("");
      setPurpose("");
      setExpiresAt("");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-5 space-y-4 shadow-sm">
      <div>
        <h2 className="text-lg font-medium text-slate-900 dark:text-white">Create coupon</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate a code to preview it, then create the coupon when ready. Codes are saved as uppercase and are not case-sensitive at
          checkout.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="space-y-1">
          <span className="text-xs text-slate-500">Category</span>
          <select
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-500">Coupon code</span>
          <input
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm uppercase bg-white dark:bg-[#0a0a0a]"
            placeholder="Generate or type a code"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-500">Discount (£)</span>
          <input
            type="number"
            min="1"
            step="0.01"
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a]"
            value={discountAmount}
            onChange={e => setDiscountAmount(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-500">Expires (optional)</span>
          <input
            type="datetime-local"
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a]"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
          />
        </label>
        <label className="space-y-1 md:col-span-2 lg:col-span-1">
          <span className="text-xs text-slate-500">Purpose (optional)</span>
          <input
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a]"
            placeholder="e.g. Samisha Instagram post"
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          disabled={generating || creating}
          onClick={() => void handleGenerateCode()}
          className="border border-brand-600 text-brand-600 dark:text-brand-400 rounded-lg px-4 py-2 text-sm disabled:opacity-60 hover:bg-brand-50 dark:hover:bg-brand-950/30"
        >
          {generating ? "Generating..." : "Generate code"}
        </button>
        <button
          type="button"
          disabled={creating || generating}
          onClick={() => void handleCreate()}
          className="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-60 hover:bg-brand-700"
        >
          {creating ? "Creating..." : "Create coupon"}
        </button>
      </div>
    </section>
  );
}

function CouponRow({
  coupon,
  onUpdated,
  muted = false,
  showExpire = false,
  showDelete = false,
  toast,
}: {
  coupon: TeamCoupon;
  onUpdated: () => void;
  muted?: boolean;
  showExpire?: boolean;
  showDelete?: boolean;
  toast: ReturnType<typeof useShowToast>;
}) {
  const [confirmAction, setConfirmAction] = useState<"expire" | "delete" | null>(null);
  const [loading, setLoading] = useState(false);

  const runAction = async () => {
    if (!confirmAction) return;
    try {
      setLoading(true);
      if (confirmAction === "expire") {
        await teamExpireCoupon(coupon.id);
        toast.success("Coupon expired");
      } else {
        await teamDeleteCoupon(coupon.id);
        toast.success("Coupon deleted");
      }
      setConfirmAction(null);
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <li className="flex items-center justify-between gap-3 text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className={`font-medium ${muted ? "text-slate-500" : "text-slate-900 dark:text-white"}`}>{coupon.code}</span>
          <CategoryBadge category={coupon.category} label={coupon.category_label} muted={muted} />
          {coupon.purpose ? <span className="text-slate-500 truncate hidden sm:inline">· {coupon.purpose}</span> : null}
          {coupon.expires_at ? <span className="text-xs text-slate-500">· expires {formatDate(coupon.expires_at)}</span> : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-500">-£{coupon.discount_amount}</span>
          {showExpire ? (
            <button
              type="button"
              onClick={() => setConfirmAction("expire")}
              className="text-xs text-amber-700 border border-amber-200 dark:border-amber-800 rounded px-2 py-1 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              Expire
            </button>
          ) : null}
          {showDelete ? (
            <button
              type="button"
              onClick={() => setConfirmAction("delete")}
              className="text-xs text-red-700 border border-red-200 dark:border-red-800 rounded px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Delete
            </button>
          ) : null}
        </div>
      </li>

      <ProfileConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction === "expire" ? "Expire coupon?" : "Delete coupon?"}
        description={
          confirmAction === "expire" ? (
            <div className="space-y-2">
              <p>
                You are about to expire <strong>{coupon.code}</strong> before its scheduled end time
                {coupon.expires_at ? ` (${formatDate(coupon.expires_at)})` : ""}.
              </p>
              <p className="text-amber-700 dark:text-amber-400">
                This cannot be undone. Users will no longer be able to apply this code at checkout.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p>
                You are about to permanently delete <strong>{coupon.code}</strong>.
              </p>
              <p className="text-red-700 dark:text-red-400">
                This removes the record from the dashboard. Only expired coupons can be deleted.
              </p>
            </div>
          )
        }
        confirmLabel={loading ? "Please wait..." : confirmAction === "expire" ? "Yes, expire now" : "Yes, delete"}
        confirmVariant="danger"
        confirmDisabled={loading}
        onConfirm={() => void runAction()}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}

type UnclaimedRowData = NonNullable<TeamSalesDashboard["unclaimed_purchases"]>[number];

function UnclaimedRow({
  row,
  onAssigned,
  toast,
}: {
  row: UnclaimedRowData;
  onAssigned: () => void;
  toast: ReturnType<typeof useShowToast>;
}) {
  const [email, setEmail] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ id: number; email: string; name?: string | null }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (email.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const result = await teamSearchUsers(email.trim());
        setSuggestions(result.users ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [email]);

  const handleAssign = async () => {
    if (!email.trim()) {
      toast.error("Enter a user email to assign");
      return;
    }
    try {
      setAssigning(true);
      await teamResolveUnicoachClaim({
        claimToken: row.claim_token,
        userEmail: email.trim(),
        userProfileId: selectedUserId,
      });
      toast.success("Payment assigned to user");
      onAssigned();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign payment");
    } finally {
      setAssigning(false);
    }
  };

  const pickUser = (user: { id: number; email: string }) => {
    setEmail(user.email);
    setSelectedUserId(user.id);
    setSuggestions([]);
  };

  return (
    <tr className="border-t border-slate-100 dark:border-slate-800 align-top">
      <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">{formatDate(row.paid_at_display)}</td>
      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.payment_type ?? "—"}</td>
      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.payer_email ?? "—"}</td>
      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.payer_phone ?? "—"}</td>
      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">£{row.amount}</td>
      <td className="px-4 py-3">
        <div className="relative space-y-2">
          <input
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a]"
            placeholder="Search user email..."
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              setSelectedUserId(null);
            }}
          />
          {searching ? <p className="text-xs text-slate-500">Searching...</p> : null}
          {suggestions.length > 0 ? (
            <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white dark:bg-[#161616] border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {suggestions.map(user => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                    onClick={() => pickUser(user)}
                  >
                    <span className="font-medium text-slate-900 dark:text-white">{user.email}</span>
                    {user.name ? <span className="text-slate-500 ml-2">{user.name}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            disabled={assigning}
            onClick={() => void handleAssign()}
            className="bg-brand-600 text-white rounded-lg px-3 py-1.5 text-sm disabled:opacity-60 hover:bg-brand-700"
          >
            {assigning ? "Assigning..." : "Assign"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatCard({
  title,
  count,
  total,
  subtitle,
  highlight = false,
}: {
  title: string;
  count?: number;
  total?: number;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight
          ? "border-brand-500/40 bg-brand-50 dark:bg-brand-950/20 dark:border-brand-500/30"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111]"
      }`}
    >
      <p className="text-sm text-slate-500">{title}</p>
      {count != null ? <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{count} payments</p> : null}
      {total != null ? <p className="text-xl font-medium text-brand-600 dark:text-brand-400 mt-1">£{Number(total).toFixed(2)}</p> : null}
      {subtitle ? <p className="text-xs text-slate-500 mt-2">{subtitle}</p> : null}
    </div>
  );
}

function CategoryBadge({ category, label, muted = false }: { category?: string; label?: string; muted?: boolean }) {
  const colorClass = muted
    ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
    : (CATEGORY_COLORS[category ?? "other"] ?? CATEGORY_COLORS.other);
  return <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${colorClass}`}>{label ?? category}</span>;
}
