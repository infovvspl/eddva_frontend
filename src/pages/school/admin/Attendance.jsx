import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Users, GraduationCap, UserCheck } from 'lucide-react';
import api from '@/lib/api/school-client';
import { getResponseList } from '@/lib/school/apiData';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Independent class/section data from API
  const [allClasses, setAllClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch all classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/academic/classes');
        const list = getResponseList(res);
        setAllClasses(list);
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    };
    fetchClasses();
  }, []);

  // Derive sections from selected class data
  useEffect(() => {
    if (!selectedClassId) {
      setSections([]);
      setSelectedSectionId('');
      return;
    }
    const selectedClass = allClasses.find(c => c.id === selectedClassId);
    const classSections = selectedClass?.sections || [];
    setSections(classSections);
    setSelectedSectionId('');
  }, [selectedClassId, allClasses]);

  // Fetch attendance with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAttendance();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [filterDate, filterType, page, limit, searchQuery, selectedClassId, selectedSectionId, selectedRole, selectedStatus]);

  const fetchAttendance = async () => {
    try {
      let params = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (filterType === 'daily') {
        params.date = filterDate;
      } else if (filterType === 'weekly') {
        const startDate = new Date(filterDate);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = filterDate;
      } else if (filterType === 'monthly') {
        const date = new Date(filterDate);
        params.startDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        params.endDate = filterDate;
      }
      
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedClassId) params.classId = selectedClassId;
      if (selectedSectionId) params.sectionId = selectedSectionId;
      if (selectedRole) params.role = selectedRole;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/attendance', { params });
      const list = getResponseList(res);
      setAttendance(list);
      
      const resData = res.data;
      if (resData) {
        if (typeof resData.total === 'number') {
          setTotal(resData.total);
          setTotalPages(resData.totalPages || 1);
        } else if (resData.data && typeof resData.data.total === 'number') {
          setTotal(resData.data.total);
          setTotalPages(resData.data.totalPages || 1);
        } else {
          setTotal(list.length);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    PRESENT: 'bg-emerald-50 text-emerald-700',
    ABSENT: 'bg-red-50 text-red-700',
    LATE: 'bg-amber-50 text-amber-700',
    LEAVE: 'bg-blue-50 text-blue-700'
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedClassId('');
    setSelectedSectionId('');
    setSelectedRole('');
    setSelectedStatus('');
    setFilterType('daily');
    setPage(1);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-surface-950">Attendance</h1>
        <p className="mt-2 text-sm text-surface-500">Track student and teacher attendance.</p>
      </div>

      <div className="mb-6 rounded-lg border border-surface-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Type filter */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">Type</label>
            <div className="flex items-center gap-2">
              {[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilterType(option.value)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                    filterType === option.value ? 'bg-brand-600 text-white' : 'border border-surface-200 text-surface-700 hover:bg-surface-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date filter */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-lg border border-surface-200 px-3 py-1 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Search filter */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">Search Name</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search user..."
              className="rounded-lg border border-surface-200 px-3 py-1 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Role filter (Teacher/Student) */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => { setSelectedRole(e.target.value); setPage(1); }}
              className="rounded-lg border border-surface-200 px-3 py-1 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All</option>
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
            </select>
          </div>

          {/* Class filter - fetched from API */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => { setSelectedClassId(e.target.value); setPage(1); }}
              className="rounded-lg border border-surface-200 px-3 py-1 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All</option>
              {allClasses.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section filter - based on selected class */}
          {selectedClassId && sections.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-surface-700">Section</label>
              <select
                value={selectedSectionId}
                onChange={(e) => { setSelectedSectionId(e.target.value); setPage(1); }}
                className="rounded-lg border border-surface-200 px-3 py-1 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">All Sections</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status filter */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="rounded-lg border border-surface-200 px-3 py-1 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="leave">Leave</option>
            </select>
          </div>

          <div className="ml-auto">
            <button
              onClick={handleClearFilters}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="min-w-[800px] w-full text-left text-sm">
          <thead className="bg-surface-50 text-surface-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              {selectedRole === 'STUDENT' && <th className="px-6 py-4 font-semibold">Class / Section</th>}
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Remarks</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {attendance.length === 0 ? (
              <tr>
                <td colSpan={selectedRole === 'STUDENT' ? "7" : "6"} className="px-6 py-8 text-center text-surface-500">
                  No attendance records match the current filters
                </td>
              </tr>
            ) : (
              attendance.map(record => (
                <tr key={record.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-surface-950">{record.user?.name || '-'}</td>
                  <td className="px-6 py-4">
                    {record.user?.role === 'STUDENT' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                        <GraduationCap className="h-3 w-3" /> Student
                      </span>
                    ) : record.user?.role === 'TEACHER' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs font-bold text-purple-700">
                        <UserCheck className="h-3 w-3" /> Teacher
                      </span>
                    ) : (
                      <span className="text-surface-400">-</span>
                    )}
                  </td>
                  {selectedRole === 'STUDENT' && (
                    <td className="px-6 py-4 text-surface-600">
                      {record.user?.role === 'STUDENT' && record.user?.studentProfile?.section?.class ? (
                        <span>
                          {record.user.studentProfile.section.class.name}
                          {record.user.studentProfile.section.name ? ` - ${record.user.studentProfile.section.name}` : ''}
                        </span>
                      ) : (
                        <span className="text-surface-400">-</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${statusColors[record.status?.toUpperCase()] || statusColors.PRESENT}`}>
                      {record.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-surface-600">
                    {record.remarks || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {record.user?.id ? (
                        <Link
                          to={record.user.role === 'STUDENT' ? `/school/admin/students/${record.user.id}` : `/school/admin/teachers/${record.user.id}`}
                          className="group relative flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="absolute -top-9 left-1/2 -translate-x-1/2 scale-0 rounded bg-surface-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">View</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-surface-50 text-surface-300"
                          aria-label="No linked user"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-surface-200 bg-white">
        <DataTablePagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}

