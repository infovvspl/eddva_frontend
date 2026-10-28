import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, IndianRupee } from "lucide-react";
import { feeNoticesApi, type FeeNoticeEntry } from "@/lib/api/fee-notices";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function classLabel(e: Pick<FeeNoticeEntry, "className" | "sectionName">) {
  if (!e.className) return null;
  return e.sectionName ? `${e.className} - ${e.sectionName}` : e.className;
}

function formatINR(n: number) {
  return `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function Row({ entry, right }: { entry: FeeNoticeEntry; right: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-2 py-1.5">
      {entry.avatar ? (
        <img src={entry.avatar} alt="" className="size-7 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
          {initials(entry.name)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-slate-900">{entry.name}</p>
        <p className="truncate text-[10px] font-semibold text-slate-400">
          {[classLabel(entry), entry.title].filter(Boolean).join(" · ")}
        </p>
      </div>
      {right}
    </li>
  );
}

/**
 * Institute-wide "fee deposited" notice + what's coming due next, for the
 * admin dashboard — mirrors the Today's Birthdays card's always-light,
 * own-row layout so it doesn't stretch its grid siblings.
 */
export default function FeeNoticesCard({ className }: { className?: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["school-fee-notices", 7],
    queryFn: () => feeNoticesApi.list(7),
    staleTime: 5 * 60_000,
  });

  if (isError) return null;
  const deposits = data?.recentDeposits ?? [];
  const dues = data?.upcomingDues ?? [];

  return (
    <div className={cn("flex w-full flex-col rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm", className)} aria-label="Fee notices">
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <IndianRupee className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">Fee Notices</p>
          <p className="text-[10px] font-semibold text-slate-400">Deposits &amp; dues · next 7 days</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600">Recently Deposited</p>
          {isLoading ? (
            <div className="space-y-1.5">
              {[1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : !deposits.length ? (
            <p className="py-2 text-xs font-semibold text-slate-400 italic">No deposits in the last 7 days.</p>
          ) : (
            <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {deposits.map((d) => (
                <Row
                  key={`${d.userId}-${d.title}`}
                  entry={d}
                  right={
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="flex items-center gap-1 text-xs font-black text-emerald-600">
                        <CheckCircle2 className="size-3" /> {formatINR(d.amountPaid)}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400">{formatDate(d.paidDate)}</span>
                    </div>
                  }
                />
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600">Due Soon</p>
          {isLoading ? (
            <div className="space-y-1.5">
              {[1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : !dues.length ? (
            <p className="py-2 text-xs font-semibold text-slate-400 italic">Nothing due in the next 7 days.</p>
          ) : (
            <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {dues.map((d) => (
                <Row
                  key={`${d.userId}-${d.title}`}
                  entry={d}
                  right={
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="flex items-center gap-1 text-xs font-black text-amber-600">
                        <Clock className="size-3" /> {formatINR(d.amount - d.amountPaid)}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400">
                        {d.daysLeft === 0 ? "Today" : `${d.daysLeft}d · ${formatDate(d.dueDate)}`}
                      </span>
                    </div>
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
