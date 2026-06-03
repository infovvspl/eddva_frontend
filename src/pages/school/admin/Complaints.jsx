import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api/school-client';
import { InstituteLogo, StatusBadge } from '@/components/school/admin/Brand';
import { Skeleton } from '@/components/school/admin/Skeleton';
import { useAuth } from '@/context/SchoolAuthContext';

const statusIcon = {
  OPEN: AlertCircle,
  IN_PROGRESS: Clock,
  RESOLVED: CheckCircle,
  CLOSED: CheckCircle,
};

export default function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [newTicket, setNewTicket] = useState({ title: '', description: '' });
  const [error, setError] = useState('');

  async function loadComplaints() {
    try {
      setLoading(true);
      const res = await api.get('/complaints');
      setComplaints(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load support tickets.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  const filteredComplaints = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return complaints;
    return complaints.filter((item) =>
      [item.title, item.description, item.status, item.institute?.name].some((value) => String(value || '').toLowerCase().includes(term))
    );
  }, [complaints, query]);

  const counts = useMemo(() => {
    return complaints.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      { total: 0, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 }
    );
  }, [complaints]);

  async function createTicket(event) {
    event.preventDefault();
    setError('');
    try {
      await api.post('/complaints', newTicket);
      setNewTicket({ title: '', description: '' });
      await loadComplaints();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to create ticket.');
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.put(`/complaints/${id}`, { status });
      await loadComplaints();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to update ticket.');
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-950">Support Operations</h1>
          <p className="mt-2 text-sm font-medium text-surface-500">
            {user?.role === 'SUPER_ADMIN' ? 'Monitor tenant support activity across institutes.' : 'Create and track support tickets for your institute.'}
          </p>
        </div>
        <div className="relative lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tickets" className="w-full rounded-lg border border-surface-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100" />
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Total', counts.total, 'bg-brand-50 text-brand-700'],
          ['Open', counts.OPEN, 'bg-red-50 text-red-600'],
          ['In Progress', counts.IN_PROGRESS, 'bg-amber-50 text-amber-700'],
          ['Resolved', counts.RESOLVED + counts.CLOSED, 'bg-emerald-50 text-emerald-600'],
        ].map(([label, value, tone]) => (
          <div key={label} className="glass-panel rounded-lg p-5 shadow-soft">
            <div className={`mb-3 inline-flex rounded-lg px-3 py-2 text-sm font-bold ${tone}`}>{label}</div>
            <p className="font-display text-3xl font-bold text-surface-950">{value}</p>
          </div>
        ))}
      </div>

      {user?.role === 'INSTITUTE_ADMIN' && (
        <form onSubmit={createTicket} className="glass-panel rounded-lg p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold text-surface-950">Create Support Ticket</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.3fr_auto]">
            <input required value={newTicket.title} onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })} className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium outline-none focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100" placeholder="Ticket title" />
            <input required value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium outline-none focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100" placeholder="Describe the issue" />
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]">
              <Plus className="h-4 w-4" />
              Create
            </button>
          </div>
        </form>
      )}

      <div className="glass-panel overflow-hidden rounded-lg shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50 text-xs font-bold uppercase text-surface-500">
                <th className="p-4 pl-5">Ticket</th>
                {user?.role === 'SUPER_ADMIN' && <th className="p-4">Institute</th>}
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Move</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-t border-surface-100">
                    <td className="p-4 pl-5"><Skeleton className="h-12 w-72" /></td>
                    {user?.role === 'SUPER_ADMIN' && <td className="p-4"><Skeleton className="h-10 w-44" /></td>}
                    <td className="p-4"><Skeleton className="h-8 w-28" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-28" /></td>
                    <td className="p-4"><Skeleton className="ml-auto h-8 w-24" /></td>
                  </tr>
                ))
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'SUPER_ADMIN' ? 5 : 4} className="p-10 text-center text-sm font-semibold text-surface-500">
                    No support tickets found.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((item) => {
                  const Icon = statusIcon[item.status] || AlertCircle;
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-surface-100 transition hover:bg-surface-50">
                      <td className="p-4 pl-5">
                        <p className="font-bold text-surface-950">{item.title}</p>
                        <p className="mt-1 max-w-xl text-xs font-medium text-surface-500">{item.description}</p>
                      </td>
                      {user?.role === 'SUPER_ADMIN' && (
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <InstituteLogo institute={item.institute} size="sm" />
                            <p className="text-sm font-bold text-surface-700">{item.institute?.name || 'Unknown'}</p>
                          </div>
                        </td>
                      )}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-2">
                          <Icon className="h-4 w-4 text-brand-600" />
                          <StatusBadge status={item.status} />
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-surface-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <select value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)} className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs font-bold text-surface-700 outline-none focus:border-brand-300">
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
