import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/school-client';
import { CheckCircle2, Clock, LifeBuoy, MessageSquare, Plus, Ticket } from 'lucide-react';

const categories = ['Academic', 'Technical', 'Attendance', 'Fees', 'Other'];

function statusClass(status) {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300';
  if (status === 'IN_PROGRESS') return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300';
  if (status === 'REOPENED') return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300';
  return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300';
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ title: '', category: categories[0], description: '' });

  const fetchTickets = async () => {
    try {
      const res = await api.get('/grievances');
      setTickets(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const counts = useMemo(() => ({
    open: tickets.filter((ticket) => ticket.status === 'OPEN' || ticket.status === 'REOPENED').length,
    inProgress: tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length,
    resolved: tickets.filter((ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length,
  }), [tickets]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    setSuccess(false);
    try {
      await api.post('/grievances', {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
      });
      setForm({ title: '', category: categories[0], description: '' });
      setSuccess(true);
      fetchTickets();
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      alert('Could not create support ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Support Tickets</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Raise support tickets and track ticket status from the student portal.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <Ticket className="h-6 w-6 text-amber-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Open</p>
          <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{counts.open}</p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <Clock className="h-6 w-6 text-blue-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">In Progress</p>
          <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{counts.inProgress}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Resolved</p>
          <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{counts.resolved}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <LifeBuoy className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Raise Ticket</h2>
              <p className="text-sm font-medium text-slate-500">Send your concern to the school support team.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                placeholder="Example: Unable to upload assignment"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Category</span>
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="mt-2 min-h-32 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                placeholder="Add details so support can resolve it faster."
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || !form.title.trim() || !form.description.trim()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {submitting ? 'Creating Ticket...' : 'Create Ticket'}
          </button>
          {success && <p className="mt-3 text-center text-sm font-bold text-emerald-600">Ticket created successfully.</p>}
        </form>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Ticket Status</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Track every request you have raised.</p>
            </div>
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
          <div className="mt-5 space-y-3">
            {tickets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-800 dark:bg-slate-950/50">
                <LifeBuoy className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">No support tickets</h3>
                <p className="mt-1 text-sm text-slate-500">Create a ticket when you need help.</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                        #{ticket.ticketNumber || ticket.ticket_number || `USR-${String(ticket.id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`}
                      </p>
                      <h3 className="text-sm font-black text-slate-950 dark:text-white">{ticket.title}</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{ticket.category || 'General'} - {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'Recently created'}</p>
                    </div>
                    <span className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(ticket.status)}`}>
                      {ticket.status || 'OPEN'}
                    </span>
                  </div>
                  {ticket.description && <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">{ticket.description}</p>}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
