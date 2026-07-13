import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api/school-client';
import { CircleDollarSign, AlertCircle, CheckCircle2, Receipt, Calendar, Landmark, ExternalLink } from 'lucide-react';

export default function StudentFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const res = await api.get('/fees');
        setFees(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch fees:', err);
        setFees([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/fees/analytics');
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      }
    };

    fetchFees();
    fetchAnalytics();
  }, []);

  const summary = useMemo(() => {
    return analytics?.summary || {
      totalRevenue: 0,
      totalCollected: 0,
      totalPending: 0,
      overdueCount: 0
    };
  }, [analytics]);


  if (loading) {
    return <div className="p-8 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading fees ledger...</div>;
  }

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">My Fees</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Review your invoices, transaction history, and outstanding balances.</p>
        </div>
      </div>

      {/* Grid Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/50 p-6 dark:border-blue-900/40 dark:bg-blue-950/20">
          <CircleDollarSign className="h-6 w-6 text-blue-600 dark:text-blue-450" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Total Outstanding Dues</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">₹{summary.totalPending}</p>
        </div>
        <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-450" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Total Paid Fees</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">₹{summary.totalCollected}</p>
        </div>
        <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50/50 p-6 dark:border-rose-900/40 dark:bg-rose-950/20 sm:col-span-2 lg:col-span-1">
          <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-455" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.2em] text-rose-700 dark:text-rose-300">Overdue Invoices</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{summary.overdueCount}</p>
        </div>
      </div>

      {/* Invoices Ledger Table */}
      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Fee Invoices</h2>
        {fees.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">No invoices generated for your profile.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-4">Invoice No</th>
                  <th className="py-4 px-4">Description</th>
                  <th className="py-4 px-4">Due Date</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {fees.map((inv) => (
                  <tr key={inv.id} className="text-slate-700 dark:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-4 px-4 font-black">#{inv.invoiceNo || inv.id?.slice(0, 8)}</td>
                    <td className="py-4 px-4 font-semibold">{inv.title || 'Tuition Fee'}</td>
                    <td className="py-4 px-4">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-4 px-4 font-black">₹{inv.amount}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {inv.status !== 'PAID' ? (
                        <button
                          onClick={() => alert('Online fee payment initiated.')}
                          className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-black text-white hover:bg-blue-750 transition active:scale-95"
                        >
                          Pay Online
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-bold flex items-center justify-end gap-1"><CheckCircle2 size={13} className="text-emerald-500" /> Complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
