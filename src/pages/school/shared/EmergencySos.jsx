import React, { useEffect, useState } from 'react';
import { Siren, Search, Mail, Smartphone, X, Loader2, Send, CheckCircle2, AlertTriangle, History, MailCheck, MailX } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { getResponseList } from '@/lib/school/apiData';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useAuth } from '@/context/SchoolAuthContext';

const getInitials = (name) => {
  if (!name) return '??';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const DEFAULT_MESSAGE_HINT = 'Leave blank to send the standard urgent template (recommended), or write your own.';

export default function EmergencySos() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'INSTITUTE_ADMIN' || user?.role === 'SUPER_ADMIN';

  const [view, setView] = useState('send');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('ALL');
  const [classes, setClasses] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [smsOn, setSmsOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  const [activeAlerts, setActiveAlerts] = useState([]);
  const [activeAlertsLoading, setActiveAlertsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get('/academic/classes')
      .then((res) => { if (mounted) setClasses(getResponseList(res)); })
      .catch(() => { if (mounted) setClasses([]); });
    return () => { mounted = false; };
  }, []);

  const fetchActiveAlerts = () => {
    setActiveAlertsLoading(true);
    api.get('/emergency-sos/mine/active')
      .then((res) => setActiveAlerts(getResponseList(res)))
      .catch(() => setActiveAlerts([]))
      .finally(() => setActiveAlertsLoading(false));
  };
  useEffect(fetchActiveAlerts, []);

  useEffect(() => {
    if (!isAdmin || view !== 'history') return;
    let cancelled = false;
    setHistoryLoading(true);
    api.get('/emergency-sos/history')
      .then((res) => { if (!cancelled) setHistory(getResponseList(res)); })
      .catch(() => { if (!cancelled) setHistory([]); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [isAdmin, view]);

  useEffect(() => {
    if (!search.trim() && classId === 'ALL') {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      const params = {
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(classId !== 'ALL' ? { classId } : {}),
        limit: 20,
      };
      api.get('/students', { params })
        .then((res) => { if (!cancelled) setResults(getResponseList(res)); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, classId]);

  const selectStudent = (student) => {
    setSelected(student);
    setMessage('');
    const profile = student.studentProfile || {};
    setSmsOn(!!profile.parentPhone);
    setEmailOn(!!profile.parentEmail);
    setConfirming(false);
  };

  const selectedProfile = selected?.studentProfile || {};
  const selectedClassName = selectedProfile.section?.class?.name || '';
  const selectedSectionName = selectedProfile.section?.name || '';
  const parentPhone = selectedProfile.parentPhone || '';
  const parentEmail = selectedProfile.parentEmail || '';
  const parentName = selectedProfile.fatherName || selectedProfile.motherName || (selected ? `Parent of ${selected.name}` : '');

  const canSend = (smsOn && !!parentPhone) || (emailOn && !!parentEmail);

  const handleSend = async () => {
    if (!selected || !canSend) return;
    const channels = [smsOn && parentPhone ? 'sms' : null, emailOn && parentEmail ? 'email' : null].filter(Boolean);
    setSending(true);
    try {
      const res = await api.post(`/emergency-sos/${selected.id}/send`, {
        channels,
        message: message.trim() || undefined,
      });
      const data = res.data?.data ?? res.data ?? {};
      const smsOk = data.sms?.attempted ? data.sms.sent : null;
      const emailOk = data.email?.attempted ? data.email.sent : null;
      if (smsOk === false && data.sms?.error) toast.warning(`SMS not delivered: ${data.sms.error}`);
      if (emailOk === false && data.email?.error) toast.warning(`Email not delivered: ${data.email.error}`);
      if (smsOk !== false && emailOk !== false) {
        toast.success('Emergency alert sent to the parent.');
      }
      setConfirming(false);
      setSelected(null);
      setResults([]);
      setSearch('');
      fetchActiveAlerts();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to send emergency alert');
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async (alertId) => {
    setResolvingId(alertId);
    try {
      await api.post(`/emergency-sos/${alertId}/resolve`);
      toast.success('Alert stopped — the parent will stop seeing it.');
      setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to stop the alert');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <Siren className="size-8 text-rose-600 shrink-0" />
            <span>Emergency SOS</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {view === 'send'
              ? "Search for a student, confirm the parent's contact details, and send an urgent alert via SMS and/or email."
              : 'Every Emergency SOS alert sent at this institute — who sent it, to whom, and when it was resolved.'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setView('send')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${view === 'send' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Send Alert
            </button>
            <button
              onClick={() => setView('history')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${view === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <History className="size-3.5" /> History
            </button>
          </div>
        )}
      </div>

      {view === 'history' ? (
        historyLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="size-7 animate-spin" /></div>
        ) : history.length === 0 ? (
          <div className="glass-premium rounded-2xl p-10 text-center">
            <History className="mx-auto mb-2 size-8 text-slate-300" />
            <p className="text-sm font-bold text-slate-500">No emergency alerts have been sent yet.</p>
          </div>
        ) : (
          <div className="glass-premium rounded-2xl overflow-x-auto">
            <table className="min-w-[840px] w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Student</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Sent By</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Channels</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Sent At</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((h) => (
                  <tr key={h.id} className="align-top hover:bg-rose-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{h.studentName}</p>
                      <p className="text-[11px] font-semibold text-slate-400">{h.className} {h.sectionName}</p>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 max-w-xs">{h.message}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{h.senderName}</p>
                      <p className="text-[11px] font-semibold text-slate-400">{h.senderRole}</p>
                    </td>
                    <td className="px-5 py-4 space-y-1">
                      {h.smsSent !== null && (
                        <p className={`flex items-center gap-1.5 text-xs font-semibold ${h.smsSent ? 'text-emerald-600' : 'text-amber-600'}`}>
                          <Smartphone className="size-3.5" /> {h.smsSent ? 'SMS sent' : (h.smsError || 'SMS not sent')}
                        </p>
                      )}
                      {h.emailSent !== null && (
                        <p className={`flex items-center gap-1.5 text-xs font-semibold ${h.emailSent ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {h.emailSent ? <MailCheck className="size-3.5" /> : <MailX className="size-3.5" />} {h.emailSent ? 'Email sent' : (h.emailError || 'Email not sent')}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${h.status === 'ACTIVE' ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {h.createdAt ? new Date(h.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {h.resolvedAt ? (
                        <>
                          <p>{new Date(h.resolvedAt).toLocaleString()}</p>
                          <p className="text-[11px] text-slate-400">by {h.resolvedByName || '—'}</p>
                        </>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <>
      {activeAlertsLoading ? null : activeAlerts.length > 0 && (
        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/70 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
            <AlertTriangle className="size-4" /> Your Active Alerts — still showing on the parent's screen
          </p>
          {activeAlerts.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white border border-rose-100 px-4 py-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-900">{a.studentName} <span className="font-semibold text-slate-400">· {a.className} {a.sectionName}</span></p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.message}</p>
              </div>
              <button
                onClick={() => handleResolve(a.id)}
                disabled={resolvingId === a.id}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors disabled:opacity-60"
              >
                {resolvingId === a.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                Stop Alert
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="glass-premium rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student by name…"
              className="w-full rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <CustomSelect
            value={classId}
            onChange={setClassId}
            options={[{ value: 'ALL', label: 'All Classes' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
            className="w-full sm:w-48"
            triggerClassName="flex size-full items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 transition"
          />
        </div>

        {searching ? (
          <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 className="size-6 animate-spin" /></div>
        ) : results.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {results.map((s) => (
              <button
                key={s.id}
                onClick={() => selectStudent(s)}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left hover:border-rose-300 hover:bg-rose-50/40 transition-colors dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {getInitials(s.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-900 dark:text-white">{s.name}</span>
                  <span className="block truncate text-[11px] font-semibold text-slate-400">
                    {s.studentProfile?.section?.class?.name} {s.studentProfile?.section?.name}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (search.trim() || classId !== 'ALL') ? (
          <p className="py-6 text-center text-sm font-semibold text-slate-400">No students found.</p>
        ) : (
          <p className="py-6 text-center text-sm font-semibold text-slate-400">Start typing a student's name, or pick a class, to search.</p>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-rose-600 to-red-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Siren className="size-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                  <p className="text-xs text-rose-100 font-semibold">{selectedClassName} {selectedSectionName}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="size-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Parent Contact</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{parentName}</p>
                <p className="text-xs font-semibold text-slate-500">{parentPhone || 'No phone on file'} · {parentEmail || 'No email on file'}</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={!parentPhone}
                  onClick={() => setSmsOn((v) => !v)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-colors ${
                    !parentPhone ? 'border-slate-100 text-slate-300 cursor-not-allowed' :
                    smsOn ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="size-4" /> SMS
                </button>
                <button
                  type="button"
                  disabled={!parentEmail}
                  onClick={() => setEmailOn((v) => !v)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-colors ${
                    !parentEmail ? 'border-slate-100 text-slate-300 cursor-not-allowed' :
                    emailOn ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="size-4" /> Email
                </button>
              </div>
              {!parentPhone && !parentEmail && (
                <p className="text-xs font-bold text-amber-600">No parent phone or email on file for this student — this alert cannot be delivered.</p>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Message (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder={DEFAULT_MESSAGE_HINT}
                  className="w-full rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-rose-400 transition-colors resize-none"
                />
              </div>

              {!confirming ? (
                <button
                  type="button"
                  disabled={!canSend}
                  onClick={() => setConfirming(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3.5 text-sm font-black text-white hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="size-4" /> Send Emergency Alert
                </button>
              ) : (
                <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 space-y-3">
                  <p className="text-sm font-bold text-rose-800">
                    Send this alert via {[smsOn && parentPhone && 'SMS', emailOn && parentEmail && 'Email'].filter(Boolean).join(' and ')} to {parentName}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirming(false)}
                      className="flex-1 rounded-xl border-2 border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={sending}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors disabled:opacity-60"
                    >
                      {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                      Confirm & Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
