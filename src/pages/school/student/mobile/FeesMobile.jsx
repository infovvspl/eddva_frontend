import React from 'react';
import { CircleDollarSign, AlertCircle, CheckCircle2, Calendar, Receipt } from 'lucide-react';

export default function FeesMobile({
  fees,
  loading,
  summary,
}) {
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading Fees Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 col-span-2 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Outstanding Fees</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              ₹{summary.totalPending || 0}
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 dark:bg-rose-950/40 dark:text-rose-400 shrink-0">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[9px] font-bold text-slate-400">Total Paid Dues</p>
          <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{summary.totalCollected || 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[9px] font-bold text-slate-400">Overdue Invoices</p>
          <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-1">{summary.overdueCount || 0}</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3.5">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">My Invoices</h2>
        {fees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
            <Receipt className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No invoices generated</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fees.map((invoice) => {
              const isPaid = invoice.status === 'PAID';
              return (
                <div
                  key={invoice.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">Invoice: #{invoice.invoiceNo || invoice.id?.slice(0, 8)}</p>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white mt-1">
                        {invoice.title || 'Tuition Fee'}
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        Due Date: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <span className="text-base font-black text-slate-800 dark:text-white">
                      ₹{invoice.amount}
                    </span>
                    {!isPaid && (
                      <button
                        onClick={() => alert('Online fee payment initiated.')}
                        className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-black text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 active:scale-95 transition-transform"
                      >
                        Pay Online
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
