import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Megaphone, Send, Trash2, Search, Building2, ChevronDown,
  AlertTriangle, CheckCircle2, FileText, X, Loader2,
  Radio, Bell, Globe, MessageSquare,
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { apiClient } from '@/lib/api/client';
import { useLocation } from 'react-router-dom';
import { useConfirm } from '@/context/ConfirmContext';
import { motion } from 'framer-motion';
import Communications from './Communications';
import { MAINTENANCE_MESSAGE, MAINTENANCE_TITLE } from '@/components/shared/MaintenanceNotice';

// ── Shared helpers ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'GENERAL',        label: 'General',         color: 'bg-slate-100 text-slate-700' },
  { value: 'ACADEMIC',       label: 'Academic',        color: 'bg-blue-100 text-blue-700' },
  { value: 'ADMINISTRATIVE', label: 'Administrative',  color: 'bg-violet-100 text-violet-700' },
  { value: 'MAINTENANCE',    label: 'Maintenance',     color: 'bg-amber-100 text-amber-800' },
  { value: 'EMERGENCY',      label: 'Emergency',       color: 'bg-red-100 text-red-700' },
];
const PRIORITIES = [
  { value: 'NORMAL', label: 'Normal', color: 'bg-slate-100 text-slate-700' },
  { value: 'HIGH',   label: 'High',   color: 'bg-orange-100 text-orange-700' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];
const ROLES_OPTIONS = [
  { value: null,               label: 'All Users' },
  { value: 'STUDENT',          label: 'Students Only' },
  { value: 'TEACHER',          label: 'Teachers Only' },
  { value: 'INSTITUTE_ADMIN',  label: 'Admins Only' },
];

function catMeta(c) { return CATEGORIES.find(x => x.value === c) ?? CATEGORIES[0]; }
function priMeta(p) { return PRIORITIES.find(x => x.value === p) ?? PRIORITIES[0]; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatCard({ icon, label, value, sub, tone }) {
  const tones = {
    blue:   'bg-blue-50   border-blue-200   text-blue-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    emerald:'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber:  'bg-amber-50  border-amber-200  text-amber-700',
  };
  return (
    <div className={`rounded-2xl border p-5 ${tones[tone] ?? tones.blue}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm">{icon}</div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  title: '', content: '', category: 'GENERAL', priority: 'NORMAL',
  targetRoles: null, expiryDate: '', scope: 'all', selectedInstitutes: [],
};

const TABS = [
  { id: 'compose', label: 'Compose Broadcast', icon: Megaphone },
  { id: 'chat',    label: 'Institute Chats',   icon: MessageSquare },
  { id: 'log',     label: 'Message Log',        icon: FileText },
];

// ── Main page ──────────────────────────────────────────────────────────────

export default function SuperAdminCommunication() {
  const confirm = useConfirm();
  const location = useLocation();
  const isSuperAdminRoute = location.pathname.startsWith('/super-admin');
  const client = isSuperAdminRoute ? apiClient : api;

  const [activeTab, setActiveTab] = useState('compose');
  const [institutes, setInstitutes] = useState([]);
  const [log, setLog] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [logSearch, setLogSearch] = useState('');
  const [logCategory, setLogCategory] = useState('');
  const [instSearch, setInstSearch] = useState('');
  const [instDropOpen, setInstDropOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const dropRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setInstDropOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const endpoint = isSuperAdminRoute ? '/admin/tenants?limit=500' : '/institutes?perPage=500';
    client.get(endpoint).then(r => {
      const list = r.data?.items ?? r.data?.data?.items ?? r.data?.data?.data ?? r.data?.data ?? [];
      setInstitutes(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, [isSuperAdminRoute, client]);

  const loadLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const params = {};
      if (logCategory) params.category = logCategory;
      const endpoint = isSuperAdminRoute ? '/admin/announcements' : '/notices/platform';
      const r = await client.get(endpoint, { params });
      
      const rawData = r.data;
      const list = isSuperAdminRoute
        ? (rawData?.announcements ?? rawData?.data?.announcements ?? [])
        : (rawData?.data ?? rawData ?? []);

      const normalizedList = list.map(n => {
        if (isSuperAdminRoute) {
          return {
            id: n.id,
            title: n.title,
            content: n.body,
            category: n.category || 'GENERAL',
            priority: n.priority || 'NORMAL',
            postedDate: n.createdAt,
            createdAt: n.createdAt,
            targetRoles: n.targetRole ? [n.targetRole.toUpperCase()] : null,
            instituteName: n.tenant?.name,
            instituteId: n.tenantId,
          };
        }
        return n;
      });
      setLog(normalizedList);
    } catch {
      setLog([]);
    } finally {
      setLogLoading(false);
    }
  }, [logCategory, isSuperAdminRoute, client]);

  useEffect(() => {
    if (activeTab !== 'log') return;
    loadLog();
  }, [activeTab, logCategory, loadLog]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const applyMaintenanceTemplate = () => {
    setForm((f) => ({
      ...f,
      title: MAINTENANCE_TITLE,
      content: MAINTENANCE_MESSAGE,
      category: 'MAINTENANCE',
      priority: 'URGENT',
      targetRoles: null,
      scope: 'all',
      selectedInstitutes: [],
    }));
  };
  const toggleInstitute = (id) => setForm(f => {
    const already = f.selectedInstitutes.includes(id);
    return {
      ...f,
      selectedInstitutes: already
        ? f.selectedInstitutes.filter(x => x !== id)
        : [...f.selectedInstitutes, id],
    };
  });

  const handleSend = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and message are required.');
      return;
    }
    setSending(true);
    try {
      if (isSuperAdminRoute) {
        let targetRole = 'all';
        if (form.targetRoles === 'STUDENT') targetRole = 'student';
        else if (form.targetRoles === 'TEACHER') targetRole = 'teacher';

        const basePayload = {
          title: form.title.trim(),
          body: form.content.trim(),
          targetRole,
          expiresAt: form.expiryDate || null,
        };

        if (form.scope === 'select' && form.selectedInstitutes.length > 0) {
          let sent = 0;
          await Promise.all(form.selectedInstitutes.map(async (tenantId) => {
            const r = await client.post('/admin/announcements', { ...basePayload, tenantId });
            sent += r.data?.sentCount ?? 1;
          }));
          setSuccess(`Broadcast delivered to ${form.selectedInstitutes.length} coaching institute(s) (${sent} users).`);
        } else {
          const r = await client.post('/admin/announcements', basePayload);
          const sent = r.data?.sentCount ?? 0;
          setSuccess(`Broadcast delivered to all coaching institutes (${sent} users).`);
        }
      } else {
        const payload = {
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category,
          priority: form.priority,
          targetRoles: form.targetRoles ? [form.targetRoles] : null,
          expiryDate: form.expiryDate || null,
          instituteIds: form.scope === 'select' ? form.selectedInstitutes : [],
        };
        const r = await client.post('/notices/broadcast', payload);
        const sent = r.data?.data?.sent ?? 0;
        setSuccess(`Broadcast delivered to ${sent} institute${sent !== 1 ? 's' : ''}.`);
      }
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteLog = async (id) => {
    const ok = await confirm({
      title: 'Delete notice?',
      message: "This will remove it from the institute's notice board.",
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      const endpoint = isSuperAdminRoute ? `/admin/announcements/${id}` : `/notices/${id}`;
      await client.delete(endpoint);
      setLog(l => l.filter(n => n.id !== id));
    } catch {
      alert('Failed to delete');
    }
  };

  const filteredLog = log.filter(n => {
    if (!logSearch) return true;
    const q = logSearch.toLowerCase();
    return n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q);
  });
  const filteredInstitutes = institutes.filter(
    i => !instSearch || i.name?.toLowerCase().includes(instSearch.toLowerCase())
  );
  const todayBroadcasts = log.filter(
    n => n.createdAt && new Date(n.createdAt).toDateString() === new Date().toDateString()
  ).length;
  const urgentNotices = log.filter(n => n.priority === 'URGENT').length;

  // Height passed to Communications when embedded here.
  // super-admin header (title ~72px + tabs ~48px + gap ~24px + page pt ~8px) ≈ 170px
  const chatHeightClass = 'h-[calc(100dvh-178px)]';

  return (
    <div className="w-full flex flex-col">

      {/* ── Page header — always visible ─────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 pt-2">
        <div className="flex items-center gap-3 mb-5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
              Platform Communication
            </h1>
            <p className="text-sm text-slate-500">
              Broadcast notices and chat directly with institute admins
            </p>
          </div>
        </div>

        {/* Stat cards — hidden on chat tab to maximise chat height */}
        {activeTab !== 'chat' && (
          <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={<Building2 className="h-5 w-5 text-blue-600" />}
              label="Total Institutes" value={institutes.length}
              sub="active on platform" tone="blue"
            />
            <StatCard
              icon={<Send className="h-5 w-5 text-violet-600" />}
              label="Total Notices" value={log.length || '—'}
              sub="platform-wide" tone="violet"
            />
            <StatCard
              icon={<Bell className="h-5 w-5 text-emerald-600" />}
              label="Today's Broadcasts" value={todayBroadcasts || '—'}
              sub="sent today" tone="emerald"
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
              label="Urgent Notices" value={urgentNotices || '—'}
              sub="high priority" tone="amber"
            />
          </div>
        )}

        {/* Tab bar */}
        <div className="mb-0 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit dark:border-slate-700 dark:bg-slate-900">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === id
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat Tab — full Communications component ──────────────── */}
      {activeTab === 'chat' && (
        <Communications heightClass={chatHeightClass} />
      )}

      {/* ── Compose / Log tabs ────────────────────────────────────── */}
      {activeTab !== 'chat' && (
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-6">

          {/* Compose ──────────────────────────────────────────────── */}
          {activeTab === 'compose' && (
            <form onSubmit={handleSend} className="max-w-2xl">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 space-y-5">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  New Broadcast
                </h2>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-amber-900">Maintenance notice</p>
                      <p className="text-xs font-medium text-amber-800">
                        Send a platform-wide maintenance alert to all users using the shared maintenance message.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={applyMaintenanceTemplate}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Use Maintenance Template
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. School reopens on Monday"
                    value={form.title}
                    onChange={e => setField('title', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Message *</label>
                  <textarea
                    rows={5}
                    placeholder="Write the full notice or announcement here..."
                    value={form.content}
                    onChange={e => setField('content', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setField('category', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
                    <select
                      value={form.priority}
                      onChange={e => setField('priority', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Target Audience</label>
                    <select
                      value={form.targetRoles ?? ''}
                      onChange={e => setField('targetRoles', e.target.value || null)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      {ROLES_OPTIONS.map(r => (
                        <option key={String(r.value)} value={r.value ?? ''}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Expires On</label>
                    <input
                      type="date"
                      value={form.expiryDate}
                      onChange={e => setField('expiryDate', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Send To</label>
                  <div className="flex gap-3">
                    {[
                      { val: 'all',    label: `All Institutes (${institutes.length})`, Icon: Globe },
                      { val: 'select', label: 'Select Institutes', Icon: Building2 },
                    ].map(({ val, label, Icon }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setField('scope', val)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                          form.scope === val
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />{label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.scope === 'select' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Choose Institutes
                      {form.selectedInstitutes.length > 0 && (
                        <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {form.selectedInstitutes.length} selected
                        </span>
                      )}
                    </label>
                    <div ref={dropRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setInstDropOpen(v => !v)}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <span>
                          {form.selectedInstitutes.length === 0
                            ? 'Click to select institutes…'
                            : `${form.selectedInstitutes.length} institute${form.selectedInstitutes.length !== 1 ? 's' : ''} selected`}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                      {instDropOpen && (
                        <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-900 max-h-56 overflow-y-auto">
                          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 px-3 py-2">
                            <input
                              autoFocus
                              placeholder="Search institutes…"
                              value={instSearch}
                              onChange={e => setInstSearch(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          {filteredInstitutes.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-slate-400">No institutes found</p>
                          ) : (
                            filteredInstitutes.map(inst => {
                              const sel = form.selectedInstitutes.includes(inst.id);
                              return (
                                <button
                                  key={inst.id}
                                  type="button"
                                  onClick={() => toggleInstitute(inst.id)}
                                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                                    sel ? 'text-blue-700 font-semibold dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <div className={`h-4 w-4 rounded border-2 transition-colors ${sel ? 'border-blue-600 bg-blue-600' : 'border-slate-300'} grid place-items-center`}>
                                    {sel && <CheckCircle2 className="h-3 w-3 text-white" />}
                                  </div>
                                  {inst.name}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />{error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />{success}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => { setForm(EMPTY_FORM); setError(null); setSuccess(null); }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {sending ? 'Sending…' : 'Send Broadcast'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Log ───────────────────────────────────────────────────── */}
          {activeTab === 'log' && (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 flex-1 min-w-48">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    placeholder="Search by title or message…"
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"
                  />
                  {logSearch && (
                    <button onClick={() => setLogSearch('')}>
                      <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-700" />
                    </button>
                  )}
                </div>
                <select
                  value={logCategory}
                  onChange={e => setLogCategory(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {logLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : filteredLog.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                  <Megaphone className="h-10 w-10 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-400">No notices found</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        {['Title', 'Institute', 'Category', 'Priority', 'Posted', 'Audience', ''].map(h => (
                          <th
                            key={h}
                            className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${
                              h === 'Category' || h === 'Priority' ? 'hidden md:table-cell'
                              : h === 'Posted' || h === 'Audience' ? 'hidden lg:table-cell'
                              : ''
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredLog.map(n => {
                        const cat = catMeta(n.category);
                        const pri = priMeta(n.priority);
                        const audience = n.targetRoles?.length
                          ? n.targetRoles.map(r => r.charAt(0) + r.slice(1).toLowerCase()).join(', ')
                          : 'All Users';
                        return (
                          <tr
                            key={n.id}
                            onClick={() => setSelectedNotice(n)}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-3.5 max-w-xs">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">{n.title}</p>
                              <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{n.content}</p>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 text-xs">
                              {n.instituteName ?? n.instituteId?.slice(0, 8) ?? '—'}
                            </td>
                            <td className="hidden md:table-cell px-4 py-3.5">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cat.color}`}>
                                {cat.label}
                              </span>
                            </td>
                            <td className="hidden md:table-cell px-4 py-3.5">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${pri.color}`}>
                                {pri.label}
                              </span>
                            </td>
                            <td className="hidden lg:table-cell px-4 py-3.5 text-xs text-slate-500">
                              {fmtDate(n.postedDate ?? n.createdAt)}
                            </td>
                            <td className="hidden lg:table-cell px-4 py-3.5 text-xs text-slate-500">{audience}</td>
                            <td className="px-4 py-3.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLog(n.id);
                                }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-950"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-xs text-slate-400">
                      {filteredLog.length} notice{filteredLog.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedNotice(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Broadcast Announcement
                </span>
                <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white mt-1">
                  {selectedNotice.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition text-slate-500 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Content</h4>
                <div className="mt-1.5 rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedNotice.content}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <div>
                  <span className="block text-[10px] uppercase tracking-wide text-slate-400">Category</span>
                  <span className="mt-1 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-750 dark:bg-blue-950 dark:text-blue-300">
                    {selectedNotice.category}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wide text-slate-400">Priority</span>
                  <span className="mt-1 inline-block rounded-full bg-orange-50 px-2.5 py-0.5 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                    {selectedNotice.priority}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wide text-slate-400">Institute</span>
                  <span className="mt-1 block font-bold text-slate-850 dark:text-slate-200">
                    {selectedNotice.instituteName || 'All Institutes'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wide text-slate-400">Posted On</span>
                  <span className="mt-1 block font-bold text-slate-850 dark:text-slate-200">
                    {fmtDate(selectedNotice.postedDate ?? selectedNotice.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedNotice(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
