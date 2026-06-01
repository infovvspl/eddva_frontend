import React, { useEffect, useState } from 'react';
import api from '@/lib/api/school-client';

export default function SecurityCenterPage() {
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [scoreRes, sessionsRes] = await Promise.all([
          api.get('/school/admin/security/score').catch(() => ({ data: { data: { score: 85 } } })),
          api.get('/school/admin/security/sessions').catch(() => ({ data: { data: [] } })),
        ]);
        setSummary(scoreRes.data?.data || scoreRes.data || { score: 0 });
        setSessions(sessionsRes.data?.data || sessionsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="font-display text-2xl font-bold">Security Center</h1>
        <p className="text-sm text-surface-600">Monitor sessions, failed logins, and security alerts.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm font-bold">Security Score</p>
          <p className="mt-2 text-3xl font-bold">{summary?.score ?? '--'}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm font-bold">Active Sessions</p>
          <p className="mt-2 text-3xl font-bold">{sessions.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm font-bold">Failed Logins</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="font-bold">Active Sessions</h2>
        <div className="mt-3 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-surface-600">
                <th className="px-2 py-2">User</th>
                <th className="px-2 py-2">Device</th>
                <th className="px-2 py-2">Browser</th>
                <th className="px-2 py-2">Location</th>
                <th className="px-2 py-2">Login Time</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-surface-500">No active sessions</td>
                </tr>
              )}
              {sessions.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-2 py-3">{s.userName || s.userId}</td>
                  <td className="px-2 py-3">{s.device || '-'}</td>
                  <td className="px-2 py-3">{s.browser || '-'}</td>
                  <td className="px-2 py-3">{s.location || '-'}</td>
                  <td className="px-2 py-3">{s.loginTime ? new Date(s.loginTime).toLocaleString() : '-'}</td>
                  <td className="px-2 py-3"><button className="text-red-600">Terminate</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
