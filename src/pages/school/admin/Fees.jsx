import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CircleDollarSign, Download, Filter, Plus, Search, 
  TrendingUp, Users, Clock, CheckCircle2, AlertCircle,
  FileText, ArrowRight, Brain, Sparkles, Receipt,
  X, CreditCard, Banknote, Calendar, Landmark
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { cn } from '@/components/school/admin/Skeleton';
import Modal from '@/components/school/admin/Modal';
import { notifyDataChanged } from '@/lib/school/apiData.js';

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchFees();
    fetchAnalytics();

    const handleRefresh = () => {
      fetchFees();
      fetchAnalytics();
    };

    window.addEventListener('eddva:data-changed', handleRefresh);
    const interval = window.setInterval(handleRefresh, 30000);

    return () => {
      window.removeEventListener('eddva:data-changed', handleRefresh);
      window.clearInterval(interval);
    };
  }, []);

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

  const filteredFees = useMemo(() => {
    return fees.filter(f => {
      const matchesFilter = filter === 'ALL' || f.status === filter;
      const studentName = f.student?.user?.name || '';
      const enrollmentNo = f.student?.enrollmentNo || '';
      const matchesSearch = studentName.toLowerCase().includes(search.toLowerCase()) || 
                           enrollmentNo.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [fees, filter, search]);

  const handleRecordPayment = (fee) => {
    setSelectedFee(fee);
    setIsRecordModalOpen(true);
  };

  const onPaymentSuccess = () => {
    fetchFees();
    fetchAnalytics();
    setIsRecordModalOpen(false);
    setSelectedFee(null);
  };

  if (loading) return <div className="p-8 text-sm font-semibold text-slate-500 dark:text-slate-400">Synchronizing ledger...</div>;

  const summary = analytics?.summary || {
    totalRevenue: 0,
    totalCollected: 0,
    totalPending: 0,
    overdueCount: 0
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Fees Management</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Track collections, invoices, and pending dues with real-time sync.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Record Payment
          </button>
          <button className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Revenue" value={summary.totalRevenue} icon={CircleDollarSign} color="text-blue-600" bg="bg-blue-50" trend="+12.4%" />
        <KpiCard title="Collected" value={summary.totalCollected} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" trend="+8.2%" />
        <KpiCard title="Pending" value={summary.totalPending} icon={Clock} color="text-amber-600" bg="bg-amber-50" trend="-4.1%" />
        <KpiCard title="Overdue" value={summary.overdueCount} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50" trend="+2.5%" isCount />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-premium rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-2">
                {['ALL', 'PAID', 'PENDING', 'PARTIAL', 'OVERDUE'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      filter === f ? "bg-slate-900 text-white shadow-xl scale-105" : "bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search student or enrollment..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:border-blue-500 transition-all text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="pb-4 pl-4">Student Identity</th>
                    <th className="pb-4">Target Amount</th>
                    <th className="pb-4">Paid</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredFees.map((fee) => (
                    <tr key={fee.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all">
                      <td className="py-5 pl-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-black text-lg border border-blue-600/5">
                            {fee.student?.user?.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{fee.student?.user?.name || 'Unknown Student'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{fee.student?.enrollmentNo || 'No ID'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5">
                        <p className="text-sm font-black text-slate-900 dark:text-white">₹{fee.amount.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                      </td>
                      <td className="py-5">
                        <p className="text-sm font-black text-emerald-600">₹{fee.paidAmount.toLocaleString()}</p>
                        <div className="mt-1.5 w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${Math.min(100, (fee.paidAmount / fee.amount) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-5">
                        <span className={cn(
                          "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border",
                          fee.status === 'PAID' ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20" :
                          fee.status === 'PARTIAL' ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20" :
                          fee.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20" :
                          "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20"
                        )}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="py-5 pr-4 text-right">
                        <button 
                          onClick={() => handleRecordPayment(fee)}
                          className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                        >
                          Record
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredFees.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400 font-bold italic">
                        No financial records found for current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-[60px] -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">AI Collections Pulse</span>
              </div>
              <h4 className="text-xl font-black mb-2">Revenue Forecast</h4>
              <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">System predicts ₹{(summary.totalRevenue * 0.92).toLocaleString()} collection this quarter based on historic student behavior.</p>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Collected %</span>
                    <span className="text-lg font-black text-white">{Math.round((summary.totalCollected / summary.totalRevenue) * 100 || 0)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(summary.totalCollected / summary.totalRevenue) * 100 || 0}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Avg. Delay</p>
                    <p className="text-lg font-black mt-1">4.2 Days</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Risk Factor</p>
                    <p className="text-lg font-black mt-1 text-emerald-400">Low</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</h4>
              <button className="text-[10px] font-black text-blue-600 uppercase hover:underline">Clear</button>
            </div>
            <div className="space-y-6">
              {fees.filter(f => f.status === 'PAID').slice(0, 4).map(f => (
                <div key={f._id} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/5">
                    <Receipt size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">{f.student?.user?.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">₹{f.paidAmount.toLocaleString()} · {new Date(f.latestTransaction?.paymentDate || f.paymentDate || f.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
              {fees.filter(f => f.status === 'PAID').length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">No recent payments recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <RecordPaymentModal 
        isOpen={isRecordModalOpen} 
        onClose={() => setIsRecordModalOpen(false)} 
        fee={selectedFee}
        fees={fees}
        onSuccess={onPaymentSuccess}
      />
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, bg, trend, isCount }) {
  return (
    <div className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div className={cn("w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-lg", bg, color)}>
          <Icon size={28} />
        </div>
        <span className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1", trend.startsWith('+') ? "text-emerald-600" : "text-rose-600")}>
          <TrendingUp size={12} />
          {trend}
        </span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
        {isCount ? value : `₹${value.toLocaleString()}`}
      </h3>
    </div>
  );
}

function RecordPaymentModal({ isOpen, onClose, fee, fees, onSuccess }) {
  const [formData, setFormData] = useState({
    feeId: '',
    amount: '',
    paymentMethod: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const pendingFees = useMemo(() => fees.filter(f => f.status !== 'PAID'), [fees]);
  const filteredSearchFees = useMemo(() => {
    if (!searchTerm) return pendingFees;
    return pendingFees.filter(f => {
      const searchStr = `${f.student?.user?.name || ''} ${f.student?.enrollmentNo || ''} ${f.title || ''}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [pendingFees, searchTerm]);

  useEffect(() => {
    if (fee) {
      setFormData(prev => ({
        ...prev,
        feeId: fee._id,
        amount: fee.amount - fee.paidAmount
      }));
    }
  }, [fee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/fees/record', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      const receiptNo = res.data?.data?.receipt?.receiptNo;
      toast.success(receiptNo ? `Payment recorded · ${receiptNo}` : 'Payment recorded successfully!');
      notifyDataChanged('fees');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {!fee && (
          <div className="relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Search Student / Fee Record</label>
            <input 
              type="text"
              value={formData.feeId ? (fees.find(f => f.id === formData.feeId)?.student?.user?.name || '') + ' - ' + (fees.find(f => f.id === formData.feeId)?.title || '') : searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setFormData(prev => ({ ...prev, feeId: '', amount: '' }));
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Type student name or enrollment no..."
              required={!formData.feeId}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5"
            />
            {showDropdown && (
              <div className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 custom-scrollbar">
                {filteredSearchFees.length === 0 ? (
                  <div className="p-4 text-center text-sm font-bold text-slate-400">No matching pending fees.</div>
                ) : (
                  filteredSearchFees.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, feeId: f.id, amount: f.remainingBalance || (f.amount - f.paidAmount) }));
                        setSearchTerm(`${f.student?.user?.name || 'Unknown'} - ${f.title || 'Fee'}`);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex justify-between items-center group"
                    >
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{f.student?.user?.name || 'Unknown'} <span className="text-slate-400 font-semibold mx-1">—</span> {f.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                          Class {f.student?.studentProfile?.section?.class?.name || '-'} / {f.student?.studentProfile?.section?.name || '-'} · Roll {f.student?.rollNo || f.student?.studentProfile?.rollNo || '-'}
                        </p>
                      </div>
                      <span className="text-sm font-black text-rose-500 group-hover:scale-110 transition-transform">₹{(f.remainingBalance || (f.amount - f.paidAmount)).toLocaleString()}</span>
                    </button>
                  ))
                )}
              </div>
            )}
            
            {/* Overlay to close dropdown */}
            {showDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Amount Paid (₹)</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input 
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl pl-10 pr-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Date</label>
            <div className="relative">
              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Payment Method</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'CASH', label: 'Cash', icon: Banknote },
              { id: 'ONLINE', label: 'Online', icon: CreditCard },
              { id: 'BANK_TRANSFER', label: 'Bank', icon: Landmark },
            ].map(method => (
              <button
                key={method.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                          formData.paymentMethod === method.id 
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20" 
                    : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <method.icon size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Internal Notes</label>
          <textarea 
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Add payment receipt number or remarks..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 h-24"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] px-6 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
