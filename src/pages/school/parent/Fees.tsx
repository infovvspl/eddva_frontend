import React from "react";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, CheckCircle2, Clock, CalendarClock, Receipt, AlertCircle, Wallet } from "lucide-react";
import { parentClient } from "@/lib/api/parent-client";
import { useParentContext } from "@/components/school/parent/ParentAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FeeEntry {
  id: string;
  title: string;
  amount: number;
  amountPaid: number;
  balance: number;
  dueDate: string | null;
  status: string;
}

interface Payment {
  id: string;
  title: string;
  amount: number;
  amountPaid: number;
  paidDate: string;
}

interface FeeSummary {
  totalDeposited: number;
  totalPending: number;
  dueFees: FeeEntry[];
  upcomingFees: FeeEntry[];
  recentPayments: Payment[];
}

function formatINR(n: number) {
  return `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-100',
  partial: 'bg-blue-50 text-blue-700 ring-blue-100',
  overdue: 'bg-rose-50 text-rose-700 ring-rose-100',
};

const CARD = "rounded-[2rem] border border-slate-100 bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-100";

function Panel({
  icon: Icon,
  iconClass,
  title,
  children,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(CARD, "p-5 sm:p-6")}>
      <div className="mb-5 flex items-center gap-3">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${iconClass} text-white shadow-lg`}>
          <Icon size={20} />
        </span>
        <h3 className="text-lg font-extrabold tracking-tight text-[#112A46]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-8 text-center">
      <p className="text-sm font-semibold text-slate-400">{text}</p>
    </div>
  );
}

const ROW = "flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md";

export default function ParentFees() {
  const { activeChildId, children, childrenLoading } = useParentContext();

  const { data, isLoading, isError } = useQuery<FeeSummary | null>({
    queryKey: ['parent-fees', activeChildId],
    queryFn: () => (activeChildId ? (parentClient.getFeeSummary(activeChildId) as Promise<FeeSummary>) : null),
    enabled: !!activeChildId,
    retry: 1,
  });

  const activeChild = children.find((c) => c.id === activeChildId);

  if (childrenLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-56 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 rounded-[1.5rem]" />
          <Skeleton className="h-28 rounded-[1.5rem]" />
        </div>
        <Skeleton className="h-64 rounded-[2rem]" />
      </div>
    );
  }

  if (!activeChildId) {
    return (
      <div className={cn(CARD, "flex flex-col items-center justify-center px-4 py-16 text-center")}>
        <span className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-md ring-1 ring-slate-100">
          <IndianRupee className="size-7" />
        </span>
        <h3 className="text-sm font-bold text-slate-900">No child linked to your account</h3>
        <p className="mt-1.5 max-w-xs text-xs text-slate-500">Fee details will appear here once your account is linked to a student.</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={cn(CARD, "flex flex-col items-center justify-center px-4 py-16 text-center")}>
        <span className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-md ring-1 ring-rose-100">
          <AlertCircle className="size-7" />
        </span>
        <h3 className="text-sm font-bold text-slate-900">Couldn't load fee details</h3>
        <p className="mt-1.5 text-xs text-slate-500">Please try again in a moment.</p>
      </div>
    );
  }

  const { totalDeposited, totalPending, dueFees, upcomingFees, recentPayments } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30">
          <Wallet size={24} />
        </span>
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-[#112A46]">Fee Details</h2>
          <p className="text-sm font-semibold text-slate-500">
            {activeChild?.name ? `${activeChild.name}'s` : "Your child's"} fee ledger — deposits, dues, and what's coming up.
          </p>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="group relative flex items-center gap-4 overflow-hidden rounded-[1.5rem] border border-[#BBF0D6] bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="pointer-events-none absolute -bottom-8 -right-8 size-28 rounded-full bg-white/50 transition-transform duration-500 group-hover:scale-125" />
          <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="size-7" />
          </span>
          <div className="relative min-w-0">
            <p className="text-3xl font-black leading-none text-[#1E293B]">{formatINR(totalDeposited)}</p>
            <p className="mt-1.5 text-sm font-bold text-[#64748B]">Deposited So Far</p>
          </div>
        </div>

        <div
          className={cn(
            "group relative flex items-center gap-4 overflow-hidden rounded-[1.5rem] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
            totalPending > 0
              ? "border-[#FBCFCF] bg-gradient-to-br from-[#FEF2F2] to-[#FFE0E0]"
              : "border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] to-[#EEF2F7]",
          )}
        >
          <div className="pointer-events-none absolute -bottom-8 -right-8 size-28 rounded-full bg-white/50 transition-transform duration-500 group-hover:scale-125" />
          <span
            className={cn(
              "relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
              totalPending > 0 ? "from-rose-500 to-red-600 shadow-rose-500/30" : "from-slate-400 to-slate-500 shadow-slate-400/30",
            )}
          >
            <Clock className="size-7" />
          </span>
          <div className="relative min-w-0">
            <p className={cn("text-3xl font-black leading-none", totalPending > 0 ? "text-[#1E293B]" : "text-slate-500")}>{formatINR(totalPending)}</p>
            <p className="mt-1.5 text-sm font-bold text-[#64748B]">Pending Dues</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Pending dues */}
        <Panel icon={AlertCircle} iconClass="from-rose-500 to-red-600 shadow-rose-500/30" title="Pending Dues">
          {dueFees.length === 0 ? (
            <EmptyRow text="No pending dues — fully up to date." />
          ) : (
            <div className="space-y-2.5">
              {dueFees.map((f) => (
                <div key={f.id} className={ROW}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-900">{f.title}</p>
                    <p className="text-xs font-semibold text-slate-400">Due {formatDate(f.dueDate)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1', STATUS_STYLE[f.status] || 'bg-slate-100 text-slate-600 ring-slate-200')}>
                      {f.status}
                    </span>
                    <span className="text-sm font-black text-rose-600">{formatINR(f.balance)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Upcoming fees */}
        <Panel icon={CalendarClock} iconClass="from-blue-500 to-indigo-600 shadow-blue-500/30" title="Upcoming Fees">
          {upcomingFees.length === 0 ? (
            <EmptyRow text="Nothing scheduled yet." />
          ) : (
            <div className="space-y-2.5">
              {upcomingFees.map((f) => (
                <div key={f.id} className={ROW}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-900">{f.title}</p>
                    <p className="text-xs font-semibold text-slate-400">Due {formatDate(f.dueDate)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-black text-slate-700">{formatINR(f.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Recent payments */}
      <Panel icon={Receipt} iconClass="from-emerald-500 to-teal-600 shadow-emerald-500/30" title="Recent Payments">
        {recentPayments.length === 0 ? (
          <EmptyRow text="No payments recorded yet." />
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {recentPayments.map((p) => (
              <div key={p.id} className={ROW}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <CheckCircle2 className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-900">{p.title}</p>
                    <p className="text-xs font-semibold text-slate-400">Paid {formatDate(p.paidDate)}</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-black text-emerald-600">{formatINR(p.amountPaid)}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
