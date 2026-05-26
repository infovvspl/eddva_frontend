import React, { useEffect, useState } from 'react';
import api from '@/lib/api/school-client';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get('/school/admin/audit-logs');
        setLogs(res.data?.data || res.data || []);
      } catch (err) {
        console.error(err);
        setLogs([]);
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
        <h1 className="font-display text-2xl font-extrabold">Audit Logs</h1>
        <p className="text-sm text-surface-600">Search and review platform activities and security events.</p>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        {loading ? (
          <p>Loading logs...</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full table-auto text-left text-sm">
              <thead>
                <tr className="text-surface-600">
                  <th className="px-2 py-2">Timestamp</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Role</th>
                  <th className="px-2 py-2">Module</th>
                  <th className="px-2 py-2">Action</th>
                  <th className="px-2 py-2">IP</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-2 py-4 text-surface-500">No logs available.</td>
                  </tr>
                )}
                {logs.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="px-2 py-3">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="px-2 py-3">{l.userName || l.user || 'System'}</td>
                    <td className="px-2 py-3">{l.role || '-'}</td>
                    <td className="px-2 py-3">{l.module}</td>
                    <td className="px-2 py-3">{l.action}</td>
                    <td className="px-2 py-3">{l.ipAddress || '-'}</td>
                    <td className="px-2 py-3">{l.status || 'OK'}</td>
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
