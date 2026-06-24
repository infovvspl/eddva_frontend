import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/context/SchoolAuthContext';

const formatDescription = (desc, action) => {
  if (!desc) return '-';
  if (typeof desc !== 'string') return String(desc);
  const trimmed = desc.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const obj = JSON.parse(trimmed);
      if (action === 'TEACHER_ASSIGNMENT_CHANGE') {
        const newLen = Array.isArray(obj.new) ? obj.new.length : 0;
        const oldLen = Array.isArray(obj.old) ? obj.old.length : 0;
        return `Teacher assignments updated (Assigned: ${newLen}, Removed: ${oldLen})`;
      }
      if (Array.isArray(obj)) {
        return obj.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(', ');
      }
      return Object.entries(obj)
        .map(([key, val]) => {
          const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
          const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          return `${displayKey}: ${displayVal}`;
        })
        .join(' | ');
    } catch (e) {
      return desc;
    }
  }
  return desc;
};

export default function AuditLogsPage() {
  const { user } = useAuth();
  const isSuperAdmin = String(user?.role || '').toUpperCase() === 'SUPER_ADMIN';

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [exporting, setExporting] = useState(false);

  // Super Admin specific state
  const [selectedInstitute, setSelectedInstitute] = useState('ALL');
  const [institutesList, setInstitutesList] = useState([]);

  // Institute Admin specific state
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [actorsList, setActorsList] = useState([]);

  // Set document title
  useEffect(() => {
    document.title = 'Audit Logs | EDDVA Admin';
  }, []);

  // Fetch institutes list for Super Admin dropdown
  useEffect(() => {
    if (isSuperAdmin) {
      const fetchInstitutes = async () => {
        try {
          const res = await apiClient.get('/school/institutes', {
            params: { perPage: 1000 }
          });
          setInstitutesList(res.data?.data || []);
        } catch (err) {
          console.error('Failed to load institutes for filter:', err);
        }
      };
      fetchInstitutes();
    }
  }, [isSuperAdmin]);

  // Fetch unique actors list for Institute Admin dropdown
  useEffect(() => {
    if (!isSuperAdmin && user?.instituteId) {
      const fetchActors = async () => {
        try {
          const res = await apiClient.get('/school/admin/audit-logs/actors');
          setActorsList(res.data || []);
        } catch (err) {
          console.error('Failed to load unique actors for filter:', err);
        }
      };
      fetchActors();
    }
  }, [isSuperAdmin, user?.instituteId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        module: selectedModule === 'ALL' ? undefined : selectedModule,
        role: selectedRole === 'ALL' ? undefined : selectedRole,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      };

      if (isSuperAdmin) {
        params.instituteId = selectedInstitute === 'ALL' ? undefined : selectedInstitute;
      } else {
        params.userId = selectedUser === 'ALL' ? undefined : selectedUser;
      }

      const res = await apiClient.get('/school/admin/audit-logs', { params });
      const resData = res.data;
      console.log("Audit Logs Response:", resData);
      setLogs(resData?.data || []);
      setTotal(resData?.meta?.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, startDate, endDate, selectedModule, selectedRole, selectedStatus, selectedInstitute, selectedUser]);

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchLogs();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const getInstituteName = (instId) => {
    if (!instId) return 'Platform';
    const inst = institutesList.find(i => i.id === instId);
    return inst ? inst.name : `Institute (${instId.slice(0, 8)})`;
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const params = {
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        module: selectedModule === 'ALL' ? undefined : selectedModule,
        role: selectedRole === 'ALL' ? undefined : selectedRole,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        limit: 10000,
      };

      if (isSuperAdmin) {
        params.instituteId = selectedInstitute === 'ALL' ? undefined : selectedInstitute;
      } else {
        params.userId = selectedUser === 'ALL' ? undefined : selectedUser;
      }

      const res = await apiClient.get('/school/admin/audit-logs', { params });
      const data = res.data?.data || [];

      // Generate CSV file content
      const headers = [
        'Timestamp',
        ...(isSuperAdmin ? ['Institute'] : []),
        'User',
        'Role',
        'Module',
        'Action',
        'Description',
        'IP Address',
        'Status'
      ];
      const rows = data.map((l) => [
        new Date(l.createdAt || l.created_at).toLocaleString(),
        ...(isSuperAdmin ? [getInstituteName(l.instituteId)] : []),
        l.userName || 'System',
        l.role || '-',
        l.module,
        l.action,
        l.description || '',
        l.ipAddress || '',
        l.status,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV export failed:', err);
      alert('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const getRoleBadgeStyle = (role) => {
    const normalRole = String(role || '').toUpperCase();
    if (normalRole === 'SUPER_ADMIN') {
      return 'bg-rose-50 text-rose-700 border-rose-200/50';
    }
    if (normalRole === 'INSTITUTE_ADMIN') {
      return 'bg-sky-50 text-sky-700 border-sky-200/50';
    }
    if (normalRole === 'TEACHER') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
    }
    if (normalRole === 'STUDENT') {
      return 'bg-amber-50 text-amber-700 border-amber-200/50';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200/50';
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 pb-12 px-6 pt-4 min-h-screen bg-slate-50/50">
      {/* Upper Header Card */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-xl overflow-hidden border border-indigo-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">System Audit Logs</h1>
            <p className="mt-2 text-indigo-200/80 text-sm max-w-xl">
              Track platform and tenant security events, system transactions, credentials provisioning, and academic modifications in real-time.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white rounded-xl font-semibold shadow-lg hover:shadow-indigo-600/30 transition-all duration-200 text-sm disabled:cursor-not-allowed group border border-indigo-500/50"
          >
            {exporting ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Interactive Filter Grid */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Search logs</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user, action, description..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-sm transition-all outline-none"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm font-semibold px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Date Picker Start */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-sm transition-all outline-none text-slate-700 bg-white"
            />
          </div>

          {/* Date Picker End */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-sm transition-all outline-none text-slate-700 bg-white"
            />
          </div>

          {/* Module dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Filter by Module</label>
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-sm transition-all outline-none bg-white cursor-pointer"
            >
              <option value="ALL">All Modules</option>
              <option value="Security">Security</option>
              <option value="Institute">Institute</option>
              <option value="Users">Users</option>
              <option value="Academic">Academic</option>
              <option value="Assessment">Assessment</option>
            </select>
          </div>

          {/* Role dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Filter by Role</label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-sm transition-all outline-none bg-white cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              {isSuperAdmin ? (
                <>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="INSTITUTE_ADMIN">Institute Admin</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STUDENT">Student</option>
                  <option value="PARENT">Parent</option>
                </>
              ) : (
                <>
                  <option value="INSTITUTE_ADMIN">Institute Admin</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STUDENT">Student</option>
                  <option value="PARENT">Parent</option>
                </>
              )}
            </select>
          </div>

          {/* Status dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Filter by Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-sm transition-all outline-none bg-white cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failure">Failure</option>
            </select>
          </div>

          {/* Role specific dynamic filter */}
          {isSuperAdmin ? (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Filter by Institute</label>
              <select
                value={selectedInstitute}
                onChange={(e) => {
                  setSelectedInstitute(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-sm transition-all outline-none bg-white cursor-pointer text-slate-700"
              >
                <option value="ALL">All Institutes</option>
                {institutesList.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Filter by User</label>
              <select
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-sm transition-all outline-none bg-white cursor-pointer text-slate-700"
              >
                <option value="ALL">All Users</option>
                {actorsList.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.name} ({act.id.slice(0, 6)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            <div className="h-6 bg-slate-100 rounded-lg w-1/4 animate-pulse" />
            <div className="space-y-3">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="grid grid-cols-7 gap-4">
                  <div className="h-10 bg-slate-50 rounded-lg col-span-1 animate-pulse" />
                  <div className="h-10 bg-slate-50 rounded-lg col-span-2 animate-pulse" />
                  <div className="h-10 bg-slate-50 rounded-lg col-span-1 animate-pulse" />
                  <div className="h-10 bg-slate-50 rounded-lg col-span-1 animate-pulse" />
                  <div className="h-10 bg-slate-50 rounded-lg col-span-1 animate-pulse" />
                  <div className="h-10 bg-slate-50 rounded-lg col-span-1 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] table-auto text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="px-5 py-4 w-44">Timestamp</th>
                  {isSuperAdmin && <th className="px-5 py-4 w-48">Institute</th>}
                  <th className="px-5 py-4 w-48">Actor</th>
                  <th className="px-5 py-4 w-32">Role</th>
                  <th className="px-5 py-4 w-32">Module</th>
                  <th className="px-5 py-4 w-40">Action</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4 w-36">IP Address</th>
                  <th className="px-5 py-4 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 9 : 8} className="px-5 py-16 text-center text-slate-400 bg-slate-50/20">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="font-semibold text-slate-500">No logs matching details were found</p>
                        <p className="text-xs text-slate-400">Try broadening your search term or adjusting filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(l.createdAt || l.created_at).toLocaleString([], {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      {/* Institute */}
                      {isSuperAdmin && (
                        <td className="px-5 py-3.5 font-semibold text-slate-700 whitespace-nowrap truncate max-w-[150px]" title={l.instituteId}>
                          {getInstituteName(l.instituteId)}
                        </td>
                      )}

                      {/* User Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <span className="text-xs font-bold text-slate-700 uppercase">
                              {(l.userName || l.user_name || 'Sys')[0]}
                            </span>
                          </div>
                          <div className="truncate max-w-[140px]">
                            <p className="font-semibold text-slate-800 leading-tight truncate">
                              {l.userName || l.user_name || 'System'}
                            </p>
                            {l.userId && (
                              <p className="text-[10px] text-slate-400 font-mono leading-none mt-1 truncate" title={l.userId}>
                                ID: {l.userId.slice(0, 8)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeStyle(l.role)}`}>
                          {l.role || 'SYSTEM'}
                        </span>
                      </td>

                      {/* Module */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-slate-600">
                        {l.module || '-'}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200/50">
                          {l.action || '-'}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-3.5 text-slate-600 break-words max-w-[300px]" title={l.description}>
                        {formatDescription(l.description, l.action)}
                      </td>

                      {/* IP Address */}
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {l.ipAddress || l.ip_address || '-'}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {l.status === 'Success' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/50" title={l.description}>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            Failure
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Paginate Bar */}
        {!loading && logs.length > 0 && (
          <div className="bg-slate-50/50 px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-semibold text-slate-700">{Math.min(page * limit, total)}</span> of{' '}
                <span className="font-semibold text-slate-700">{total}</span> entries
              </span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-lg text-xs outline-none bg-white cursor-pointer text-slate-600 font-semibold"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300 text-slate-600 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (totalPages > 6 && Math.abs(pageNum - page) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="text-slate-400 px-1 text-xs">...</span>;
                  }
                  return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      page === pageNum
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300 text-slate-600 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
