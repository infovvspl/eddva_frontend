import React from "react";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, CheckCircle2, Clock, CalendarClock, Receipt, AlertCircle } from "lucide-react";
import { parentClient } from "@/lib/api/parent-client";
import { useParentContext } from "@/components/school/parent/ParentAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import GlassCard from "@/components/school/GlassCard";
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
  pending: 'bg-amber-50 text-amber-700',
  partial: 'bg-blue-50 text-blue-700',
  overdue: 'bg-rose-50 text-rose-700',
};

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
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!activeChildId) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
        <IndianRupee className="size-10 text-slate-400 mb-3" />
        <h3 className="text-sm font-bold text-slate-900">No child linked to your account</h3>
        <p className="mt-1.5 text-xs text-slate-500 max-w-xs">Fee details will appear here once your account is linked to a student.</p>
      </GlassCard>
    );
  }

  if (isError || !data) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="size-10 text-rose-400 mb-3" />
        <h3 className="text-sm font-bold text-slate-900">Couldn't load fee details</h3>
        <p className="mt-1.5 text-xs text-slate-500">Please try again in a moment.</p>
      </GlassCard>
    );
  }

  const { totalDeposited, totalPending, dueFees, upcomingFees, recentPayments } = data;

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fee Details</h2>
        <p className="text-sm font-semibold text-slate-500">
          {activeChild?.name ? `${activeChild.name}'s` : "Your child's"} fee ledger — deposits, dues, and what's coming up.
        </p>
      </div>

      {/* Summary tiles */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deposited So Far</p>
            <p className="text-2xl font-black text-emerald-700">{formatINR(totalDeposited)}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4">
          <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl', totalPending > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400')}>
            <Clock className="size-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Dues</p>
            <p className={cn('text-2xl font-black', totalPending > 0 ? 'text-rose-700' : 'text-slate-500')}>{formatINR(totalPending)}</p>
          </div>
        </GlassCard>
      </div>

      {/* Pending dues */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="size-5 text-rose-500" />
          <h3 className="text-base font-black text-slate-900">Pending Dues</h3>
        </div>
        {dueFees.length === 0 ? (
          <p className="text-sm font-semibold text-slate-400 italic py-4">No pending dues — fully up to date.</p>
        ) : (
          <div className="space-y-2.5">
            {dueFees.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/60 p-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{f.title}</p>
                  <p className="text-xs font-semibold text-slate-400">Due {formatDate(f.dueDate)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase', STATUS_STYLE[f.status] || 'bg-slate-100 text-slate-600')}>
                    {f.status}
                  </span>
                  <span className="text-sm font-black text-rose-600">{formatINR(f.balance)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Upcoming fees */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="size-5 text-blue-500" />
          <h3 className="text-base font-black text-slate-900">Upcoming Fees</h3>
        </div>
        {upcomingFees.length === 0 ? (
          <p className="text-sm font-semibold text-slate-400 italic py-4">Nothing scheduled yet.</p>
        ) : (
          <div className="space-y-2.5">
            {upcomingFees.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/60 p-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{f.title}</p>
                  <p className="text-xs font-semibold text-slate-400">Due {formatDate(f.dueDate)}</p>
                </div>
                <span className="text-sm font-black text-slate-700 shrink-0">{formatINR(f.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Recent payments */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="size-5 text-emerald-500" />
          <h3 className="text-base font-black text-slate-900">Recent Payments</h3>
        </div>
        {recentPayments.length === 0 ? (
          <p className="text-sm font-semibold text-slate-400 italic py-4">No payments recorded yet.</p>
        ) : (
          <div className="space-y-2.5">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/60 p-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{p.title}</p>
                  <p className="text-xs font-semibold text-slate-400">Paid {formatDate(p.paidDate)}</p>
                </div>
                <span className="text-sm font-black text-emerald-600 shrink-0">{formatINR(p.amountPaid)}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
