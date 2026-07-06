import React, { useEffect, useState, useRef } from 'react';
import api from '@/lib/api/school-client';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { ShieldCheck, Activity, AlertTriangle, Search, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const getBrowserName = (ua) => {
  if (!ua) return '-';
  if (ua === 'Chrome') return 'Chrome';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  return ua;
};

export default function SecurityCenterPage() {
  const location = useLocation();
  const isSuperAdminRoute = location.pathname.startsWith('/super-admin');
  const client = isSuperAdminRoute ? apiClient : api;

  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(isSuperAdminRoute ? 'All Institutes' : 'All Schools');
  const [currentPage, setCurrentPage] = useState(1);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Autocomplete state
  const [institutes, setInstitutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const fetchSessions = async (mounted = true) => {
    try {
      const summaryUrl = isSuperAdminRoute ? '/super-admin/security/summary' : '/admin/security/summary';
      const summaryRes = await client.get(summaryUrl).catch(() => ({ data: { data: { activeSessions: 0 } } }));
      setSummary(summaryRes.data?.data || summaryRes.data || { activeSessions: 0 });

      const sessionsUrl = isSuperAdminRoute ? '/super-admin/security/sessions' : '/admin/security/sessions';
      const sessionsRes = await client.get(sessionsUrl);
      setSessions(sessionsRes.data?.data || sessionsRes.data || []);
    } catch (err) {
      console.error('Failed to load active sessions:', err);
      toast.error('Unable to load active sessions');
    } finally {
      if (mounted) setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchSessions(mounted);
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    const listUrl = isSuperAdminRoute ? '/super-admin/tenants' : '/institutes';
    const params = isSuperAdminRoute ? { limit: 500 } : { perPage: 500 };
    client.get(listUrl, { params })
      .then(res => {
        const data = res.data?.data?.items || res.data?.items || res.data?.data?.institutes || res.data?.data || [];
        if (Array.isArray(data)) {
          setInstitutes(data);
        } else if (data && Array.isArray(data.items)) {
          setInstitutes(data.items);
        }
      })
      .catch(err => console.error("Failed to load institutes:", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const terminateSession = async (sessionId) => {
    try {
      const deleteUrl = isSuperAdminRoute ? `/super-admin/security/sessions/${sessionId}` : `/admin/security/sessions/${sessionId}`;
      await client.delete(deleteUrl);
      toast.success('Session terminated successfully');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to terminate session');
    }
  };

  const filteredSessions = sessions.filter(s => {
    const matchesSchool = (selectedSchool === 'All Schools' || selectedSchool === 'All Institutes' || s.schoolName === selectedSchool);
    const query = userSearchTerm.toLowerCase();
    const matchesSearch = !query || 
      (s.userName && s.userName.toLowerCase().includes(query)) ||
      (s.userId && s.userId.toLowerCase().includes(query)) ||
      (s.description && s.description.toLowerCase().includes(query)) ||
      (s.ipAddress && s.ipAddress.toLowerCase().includes(query)) ||
      (s.status && s.status.toLowerCase().includes(query));
      
    return matchesSchool && matchesSearch;
  });

  const filteredInstitutes = institutes.filter(inst => 
    inst.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSchool, searchTerm, userSearchTerm]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="font-display text-2xl font-bold">Security Center</h1>
        <p className="text-sm text-surface-600">Monitor sessions, failed logins, and security alerts.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Security Score */}
        <div className="flex flex-col justify-between rounded-lg border bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center space-x-2 text-surface-600">
            <ShieldCheck className="h-4 w-4 text-primary-600" />
            <p className="text-sm font-semibold">Security Score</p>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-surface-900">
              {summary?.securityScore != null ? `${summary.securityScore}%` : '100%'}
            </p>
            <p className="text-xs text-surface-500">
              {summary?.securityScore >= 90 ? 'Excellent' : summary?.securityScore >= 80 ? 'Good' : 'Needs attention'}
            </p>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="flex flex-col justify-between rounded-lg border bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center space-x-2 text-surface-600">
            <Activity className="h-4 w-4 text-primary-600" />
            <p className="text-sm font-semibold">Active Sessions</p>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-surface-900">
              {(selectedSchool === 'All Schools' || selectedSchool === 'All Institutes') ? (summary?.activeSessions ?? sessions.length) : filteredSessions.length}
            </p>
          </div>
        </div>

        {/* Failed Logins */}
        <div className="flex flex-col justify-between rounded-lg border bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center space-x-2 text-surface-600">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <p className="text-sm font-semibold">Failed Logins</p>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-surface-900">
              {summary?.failedLogins ?? 0}
            </p>
            <p className="text-xs text-surface-500">Failed attempts today</p>
          </div>
        </div>
      </div>

      {/* Active Sessions Table */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b bg-surface-50 p-4 gap-4">
          <h2 className="font-bold text-surface-900">Active Sessions</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-surface-400" />
              </div>
              <input
                type="text"
                placeholder="Search user, IP..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="block w-full rounded-md border border-surface-300 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {/* Institute Dropdown Select */}
            <div className="relative z-10 w-full sm:w-64" ref={searchRef}>
              {(selectedSchool !== 'All Schools' && selectedSchool !== 'All Institutes') ? (
                <div className="flex w-full items-center justify-between rounded-md border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
                  <span className="truncate">{selectedSchool}</span>
                  <button 
                    onClick={() => {
                      setSelectedSchool(isSuperAdminRoute ? 'All Institutes' : 'All Schools');
                      setSearchTerm('');
                    }} 
                    className="ml-2 flex-shrink-0 text-primary-400 hover:text-primary-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder={isSuperAdminRoute ? "Filter by institute..." : "Filter by school..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchOpen(true)}
                    className="block w-full rounded-md border border-surface-300 bg-white py-1.5 pr-8 pl-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-surface-400" />
                  </div>
                  
                  {isSearchOpen && (
                    <div className="absolute right-0 top-full mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white py-1 shadow-lg z-20">
                      <button
                        onClick={() => {
                          setSelectedSchool(isSuperAdminRoute ? 'All Institutes' : 'All Schools');
                          setIsSearchOpen(false);
                          setSearchTerm('');
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-surface-700 hover:bg-surface-50"
                      >
                        {isSuperAdminRoute ? 'All Institutes' : 'All Schools'}
                      </button>
                      {filteredInstitutes.length > 0 ? (
                        filteredInstitutes.map(inst => (
                          <button
                            key={inst.id}
                            onClick={() => {
                              setSelectedSchool(inst.name);
                              setIsSearchOpen(false);
                              setSearchTerm('');
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-surface-700 hover:bg-surface-50"
                          >
                            <span className="truncate block">{inst.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-surface-500">
                          {isSuperAdminRoute ? 'No institutes found' : 'No schools found'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50">
              <tr className="border-b font-semibold text-surface-700">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">{isSuperAdminRoute ? 'Institute' : 'School'}</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Login Time</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-surface-500">No active sessions</td>
                </tr>
              )}
              {paginatedSessions.map((s) => (
                <tr key={s.sessionId} className={`group transition-colors ${s.status === 'Failure' ? 'bg-red-50/40 hover:bg-red-50/60' : s.isTerminated ? 'bg-surface-50 opacity-60' : 'hover:bg-surface-50'}`}>
                  <td className="px-4 py-4">
                    {s.status === 'Failure' ? (
                      <div>
                        <div className="font-semibold text-red-700">Failed Login Attempt</div>
                        <div className="text-xs text-surface-500 font-medium">{s.description}</div>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium text-surface-900">{s.userName || s.userId}</div>
                        {s.role && <div className="text-xs text-surface-500">{s.role}</div>}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-4 text-surface-600">{s.schoolName || '-'}</td>
                  <td className="px-4 py-4 text-surface-600">{s.ipAddress || '-'}</td>
                  <td className="px-4 py-4 text-surface-600">
                    {s.loginAt ? new Date(s.loginAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-'}
                  </td>
                  <td className="px-4 py-4">
                    {s.status === 'Failure' ? (
                      <span className="inline-flex items-center rounded-md bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600">
                        Failed
                      </span>
                    ) : s.isTerminated ? (
                      <span className="inline-flex items-center rounded-md bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-600">
                        Terminated
                      </span>
                    ) : (
                      <button
                        onClick={() => terminateSession(s.sessionId)}
                        className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-100"
                      >
                        Terminate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t bg-surface-50 px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-surface-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredSessions.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredSessions.length}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-surface-400 ring-1 ring-inset ring-surface-300 hover:bg-surface-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        aria-current={currentPage === pageNum ? 'page' : undefined}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                          currentPage === pageNum
                            ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                            : 'text-surface-900 ring-1 ring-inset ring-surface-300 hover:bg-surface-50 focus:outline-offset-0'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-surface-400 ring-1 ring-inset ring-surface-300 hover:bg-surface-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
