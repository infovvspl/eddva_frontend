import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Users, GraduationCap, UserCheck, Filter, Search, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api/school-client';
import { getResponseList } from '@/lib/school/apiData';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const TYPE_OPTIONS = [
  { value: 'daily', label: 'By Date' },
  { value: 'monthly', label: 'By Month' },
  { value: 'weekly', label: 'By Week' },
];

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [rollNoQuery, setRollNoQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Independent class/section data from API
  const [allClasses, setAllClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [flaggedUserIds, setFlaggedUserIds] = useState(new Set());

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

  // Fetch teachers once, used for the "Teacher Name" filter when Role = Teacher
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await api.get('/teachers', { params: { limit: 500 } });
        setAllTeachers(getResponseList(res));
      } catch (err) {
        console.error('Failed to fetch teachers:', err);
      }
    };
    fetchTeachers();
  }, []);

  // Students/teachers below their attendance threshold, for the Flagged indicator
  useEffect(() => {
    const fetchFlagged = async () => {
      try {
        const role = selectedRole === 'TEACHER' ? 'TEACHER' : 'STUDENT';
        const params = { role };
        if (role === 'STUDENT' && selectedClassId) params.classId = selectedClassId;
        if (role === 'STUDENT' && selectedSectionId) params.sectionId = selectedSectionId;
        const res = await api.get('/attendance/below-threshold', { params });
        const list = getResponseList(res);
        setFlaggedUserIds(new Set(list.map((r) => r.user_id || r.userId)));
      } catch (err) {
        console.error('Failed to fetch flagged attendance:', err);
      }
    };
    fetchFlagged();
  }, [selectedRole, selectedClassId, selectedSectionId]);

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
  }, [filterDate, filterMonth, filterType, page, limit, searchQuery, rollNoQuery, selectedClassId, selectedSectionId, selectedRole, selectedStatus, selectedTeacherId]);

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
        const [year, month] = filterMonth.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        params.startDate = `${filterMonth}-01`;
        params.endDate = `${filterMonth}-${String(lastDay).padStart(2, '0')}`;
      }

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedRole === 'STUDENT') {
        if (selectedClassId) params.classId = selectedClassId;
        if (selectedSectionId) params.sectionId = selectedSectionId;
        if (rollNoQuery.trim()) params.rollNo = rollNoQuery.trim();
      }
      if (selectedRole === 'TEACHER' && selectedTeacherId) params.userId = selectedTeacherId;
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
    PRESENT: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
    ABSENT: 'bg-red-50 text-red-700 hover:bg-red-50',
    LATE: 'bg-amber-50 text-amber-700 hover:bg-amber-50',
    LEAVE: 'bg-blue-50 text-blue-700 hover:bg-blue-50'
  };

  const getRoleKey = (role) => String(role || '').toUpperCase().replace(/\s+/g, '_');
  const hasRole = (role, target) => getRoleKey(role).split(',').map(r => r.trim()).includes(target);

  const handleClearFilters = () => {
    setSearchQuery('');
    setRollNoQuery('');
    setSelectedClassId('');
    setSelectedSectionId('');
    setSelectedRole('');
    setSelectedStatus('');
    setSelectedTeacherId('');
    setFilterType('daily');
    setPage(1);
  };

  const handleClassFilterChange = (value) => {
    setSelectedClassId(value);
    setPage(1);
  };

  const handleSectionFilterChange = (value) => {
    setSelectedSectionId(value);
    setPage(1);
  };

  const handleRoleFilterChange = (value) => {
    setSelectedRole(value);
    setSelectedClassId('');
    setSelectedSectionId('');
    setRollNoQuery('');
    setSelectedTeacherId('');
    setPage(1);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10">
      <div className="mb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-surface-955">Attendance</h1>
        <p className="mt-1 text-xs sm:text-sm text-surface-500">Track student and teacher attendance.</p>
      </div>

      <div className="mb-6 rounded-lg border border-surface-200 bg-white p-3 shadow-sm">
        {/* ── Mobile Layout Filters ── */}
        <div className="flex flex-col md:hidden gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-2.5 py-1 text-xs font-semibold text-surface-700">
              <Users className="size-3.5 text-brand-600" />
              <span>Filters</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition",
                showMobileFilters
                  ? "bg-brand-600 border-brand-700 text-white"
                  : "bg-white border-surface-200 text-surface-700"
              )}
            >
              <Filter className="size-3.5" />
              <span>{showMobileFilters ? "Hide" : "Show"}</span>
            </button>
          </div>

          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search user..."
              className="w-full rounded-lg border border-surface-200 py-2 pl-9 pr-3 text-sm font-semibold text-surface-900 outline-none placeholder:text-surface-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {showMobileFilters && (
            <div className="flex flex-col gap-3 pt-3 border-t border-surface-100">
              {/* Type filter */}
              <div className="w-full">
                <label className="mb-1 block text-xs font-semibold text-surface-700">Type</label>
                <CustomSelect
                  onChange={setFilterType}
                  value={filterType}
                  options={TYPE_OPTIONS}
                  className="w-full"
                />
              </div>

              {/* Date / Month picker, depending on Type */}
              {filterType === 'monthly' ? (
                <div className="w-full">
                  <label className="mb-1 block text-xs font-semibold text-surface-700">Month</label>
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              ) : (
                <div className="w-full">
                  <label className="mb-1 block text-xs font-semibold text-surface-700">{filterType === 'weekly' ? 'Week of' : 'Date'}</label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              )}

              {/* Role filter (Teacher/Student) */}
              <div className="w-full">
                <label className="mb-1 block text-xs font-semibold text-surface-700">Role</label>
                <CustomSelect
                  onChange={handleRoleFilterChange}
                  value={selectedRole}
                  options={[
                    { value: "", label: "All Roles" },
                    { value: "STUDENT", label: "Student" },
                    { value: "TEACHER", label: "Teacher" },
                    { value: "INSTITUTE_ADMIN", label: "Admins" },
                  ]}
                  className="w-full"
                />
              </div>

              {/* Class/Section filters — only when Role = Student */}
              {selectedRole === 'STUDENT' && (
                <>
                  <div className="w-full">
                    <label className="mb-1 block text-xs font-semibold text-surface-700">Class</label>
                    <CustomSelect
                      onChange={handleClassFilterChange}
                      value={selectedClassId}
                      options={[
                        { value: "", label: "All Classes" },
                        ...allClasses.map((classItem) => ({ value: classItem.id, label: classItem.name })),
                      ]}
                      className="w-full"
                    />
                  </div>

                  {selectedClassId && sections.length > 0 && (
                    <div className="w-full">
                      <label className="mb-1 block text-xs font-semibold text-surface-700">Section</label>
                      <CustomSelect
                        onChange={handleSectionFilterChange}
                        value={selectedSectionId}
                        options={[
                          { value: "", label: "All Sections" },
                          ...sections.map((sec) => ({ value: sec.id, label: sec.name })),
                        ]}
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="w-full">
                    <label className="mb-1 block text-xs font-semibold text-surface-700">Roll Number</label>
                    <input
                      type="text"
                      value={rollNoQuery}
                      onChange={(e) => { setRollNoQuery(e.target.value); setPage(1); }}
                      placeholder="Search roll number..."
                      className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </>
              )}

              {/* Teacher Name filter — only when Role = Teacher */}
              {selectedRole === 'TEACHER' && (
                <div className="w-full">
                  <label className="mb-1 block text-xs font-semibold text-surface-700">Teacher Name</label>
                  <CustomSelect
                    onChange={setSelectedTeacherId}
                    value={selectedTeacherId}
                    options={[
                      { value: "", label: "All Teachers" },
                      ...allTeachers.map((t) => ({ value: t.id, label: t.name })),
                    ]}
                    className="w-full"
                  />
                </div>
              )}

              {/* Status filter */}
              <div className="w-full">
                <label className="mb-1 block text-xs font-semibold text-surface-700">Status</label>
                <CustomSelect
                  onChange={setSelectedStatus}
                  value={selectedStatus}
                  options={[
                    { value: "", label: "All Status" },
                    { value: "present", label: "Present" },
                    { value: "absent", label: "Absent" },
                    { value: "late", label: "Late" },
                    { value: "leave", label: "Leave" },
                  ]}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end mt-2 pt-2 border-t border-surface-100">
                <button
                  onClick={handleClearFilters}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Desktop Layout Filters ── */}
        <div className="hidden md:flex flex-wrap items-center gap-3">
          {/* Type filter */}
          <div className="w-36">
            <label className="mb-1 block text-xs font-semibold text-surface-700">Type</label>
            <CustomSelect
              onChange={setFilterType}
              value={filterType}
              options={TYPE_OPTIONS}
              className="w-full"
            />
          </div>

          {/* Date / Month picker, depending on Type */}
          {filterType === 'monthly' ? (
            <div className="w-36">
              <label className="mb-1 block text-xs font-semibold text-surface-700">Month</label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          ) : (
            <div className="w-36">
              <label className="mb-1 block text-xs font-semibold text-surface-700">{filterType === 'weekly' ? 'Week of' : 'Date'}</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          )}

          {/* Search filter */}
          <div className="w-44">
            <label className="mb-1 block text-xs font-semibold text-surface-700">Search Name</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search user..."
              className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Role filter (Teacher/Student) */}
          <div className="w-36">
            <label className="mb-1 block text-xs font-semibold text-surface-700">Role</label>
            <CustomSelect
              onChange={handleRoleFilterChange}
              value={selectedRole}
              options={[
                { value: "", label: "All Roles" },
                { value: "STUDENT", label: "Student" },
                { value: "TEACHER", label: "Teacher" },
                { value: "INSTITUTE_ADMIN", label: "Admins" },
              ]}
              className="w-full"
            />
          </div>

          {/* Class/Section/Roll Number - only when Role = Student */}
          {selectedRole === 'STUDENT' && (
            <>
              <div className="w-40">
                <label className="mb-1 block text-xs font-semibold text-surface-700">Class</label>
                <CustomSelect
                  onChange={handleClassFilterChange}
                  value={selectedClassId}
                  options={[
                    { value: "", label: "All Classes" },
                    ...allClasses.map((classItem) => ({ value: classItem.id, label: classItem.name })),
                  ]}
                  className="w-full"
                />
              </div>

              {selectedClassId && sections.length > 0 && (
                <div className="w-40">
                  <label className="mb-1 block text-xs font-semibold text-surface-700">Section</label>
                  <CustomSelect
                    onChange={handleSectionFilterChange}
                    value={selectedSectionId}
                    options={[
                      { value: "", label: "All Sections" },
                      ...sections.map((sec) => ({ value: sec.id, label: sec.name })),
                    ]}
                    className="w-full"
                  />
                </div>
              )}

              <div className="w-36">
                <label className="mb-1 block text-xs font-semibold text-surface-700">Roll Number</label>
                <input
                  type="text"
                  value={rollNoQuery}
                  onChange={(e) => { setRollNoQuery(e.target.value); setPage(1); }}
                  placeholder="Roll no..."
                  className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </>
          )}

          {/* Teacher Name - only when Role = Teacher */}
          {selectedRole === 'TEACHER' && (
            <div className="w-44">
              <label className="mb-1 block text-xs font-semibold text-surface-700">Teacher Name</label>
              <CustomSelect
                onChange={setSelectedTeacherId}
                value={selectedTeacherId}
                options={[
                  { value: "", label: "All Teachers" },
                  ...allTeachers.map((t) => ({ value: t.id, label: t.name })),
                ]}
                className="w-full"
              />
            </div>
          )}

          {/* Status filter */}
          <div className="w-36">
            <label className="mb-1 block text-xs font-semibold text-surface-700">Status</label>
            <CustomSelect
              onChange={setSelectedStatus}
              value={selectedStatus}
              options={[
                { value: "", label: "All Status" },
                { value: "present", label: "Present" },
                { value: "absent", label: "Absent" },
                { value: "late", label: "Late" },
                { value: "leave", label: "Leave" },
              ]}
              className="w-full"
            />
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

      {/* Desktop View */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-surface-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px] w-full text-left text-sm">
            <TableHeader className="bg-surface-50 text-surface-500">
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="h-auto px-6 py-4 font-semibold sticky left-0 z-20 bg-surface-50 dark:bg-slate-850 shadow-sm text-surface-500">Name</TableHead>
                <TableHead className="h-auto px-6 py-4 font-semibold text-surface-500">Role</TableHead>
                {selectedRole === 'STUDENT' && <TableHead className="h-auto px-6 py-4 font-semibold text-surface-500">Class / Section</TableHead>}
                <TableHead className="h-auto px-6 py-4 font-semibold text-surface-500">Date</TableHead>
                <TableHead className="h-auto px-6 py-4 font-semibold text-surface-500">Status</TableHead>
                <TableHead className="h-auto px-6 py-4 font-semibold text-surface-500">Remarks</TableHead>
                <TableHead className="h-auto px-6 py-4 font-semibold text-surface-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-surface-200 [&_tr]:border-b-0">
              {attendance.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={selectedRole === 'STUDENT' ? "7" : "6"} className="px-6 py-8 text-center text-surface-500">
                    No attendance records match the current filters
                  </TableCell>
                </TableRow>
              ) : (
                attendance.map(record => (
                  <TableRow key={record.id} className="hover:bg-surface-50 transition-colors">
                    <TableCell className="p-4 px-6 py-4 font-semibold text-surface-950 sticky left-0 z-20 bg-white dark:bg-slate-900">{record.user?.name || '-'}</TableCell>
                    <TableCell className="p-4 px-6 py-4">
                      {hasRole(record.user?.role, 'STUDENT') ? (
                        <Badge variant="secondary" className="items-center gap-1 rounded-full border-transparent bg-blue-50 text-xs font-bold text-blue-700 hover:bg-blue-50">
                          <GraduationCap className="size-3" /> Student
                        </Badge>
                      ) : hasRole(record.user?.role, 'INSTITUTE_ADMIN') ? (
                        <Badge variant="secondary" className="items-center gap-1 rounded-full border-transparent bg-sky-50 text-xs font-bold text-sky-700 hover:bg-sky-50">
                          <UserCheck className="size-3" /> Admin
                        </Badge>
                      ) : hasRole(record.user?.role, 'TEACHER') ? (
                        <Badge variant="secondary" className="items-center gap-1 rounded-full border-transparent bg-purple-50 text-xs font-bold text-purple-700 hover:bg-purple-50">
                          <UserCheck className="size-3" /> Teacher
                        </Badge>
                      ) : (
                        <span className="text-surface-400">-</span>
                      )}
                    </TableCell>
                    {selectedRole === 'STUDENT' && (
                      <TableCell className="p-4 px-6 py-4 text-surface-600">
                        {hasRole(record.user?.role, 'STUDENT') && record.user?.studentProfile?.section?.class ? (
                          <span>
                            {record.user.studentProfile.section.class.name}
                            {record.user.studentProfile.section.name ? ` - ${record.user.studentProfile.section.name}` : ''}
                          </span>
                        ) : (
                          <span className="text-surface-400">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="p-4 px-6 py-4">{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell className="p-4 px-6 py-4">
                      <Badge className={`rounded-full text-xs font-bold border-transparent ${statusColors[record.status?.toUpperCase()] || statusColors.PRESENT}`}>
                        {record.status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 px-6 py-4 text-surface-600">
                      {record.remarks || '-'}
                    </TableCell>
                    <TableCell className="p-4 px-6 py-4">
                      <div className="flex gap-2">
                        {record.user?.id ? (
                          <Link
                            to={hasRole(record.user.role, 'STUDENT') ? `/school/admin/students/${record.user.id}` : `/school/admin/teachers/${record.user.id}`}
                            className="group relative flex size-8 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600"
                          >
                            <Eye className="size-4" />
                            <span className="absolute -top-9 left-1/2 -translate-x-1/2 scale-0 rounded bg-surface-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">View</span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="flex size-8 items-center justify-center rounded-lg border border-surface-200 bg-surface-50 text-surface-300"
                            aria-label="No linked user"
                          >
                            <Eye className="size-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden space-y-4">
        {attendance.length === 0 ? (
          <div className="rounded-lg border border-surface-200 bg-white p-8 text-center text-surface-500 text-sm">
            No attendance records match the current filters
          </div>
        ) : (
          attendance.map(record => (
            <div key={record.id} className="rounded-lg border border-surface-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-surface-950 text-sm">{record.user?.name || '-'}</span>
                <Badge className={`rounded-full border-transparent text-[10px] font-bold ${statusColors[record.status?.toUpperCase()] || statusColors.PRESENT}`}>
                  {record.status?.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-surface-600 pt-1">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-surface-400 font-bold">Role</span>
                  {hasRole(record.user?.role, 'STUDENT') ? (
                    <Badge variant="secondary" className="items-center gap-1 rounded-full border-transparent bg-blue-50 text-xs font-bold text-blue-700 mt-0.5 hover:bg-blue-50">
                      <GraduationCap className="size-3.5" /> Student
                    </Badge>
                  ) : hasRole(record.user?.role, 'INSTITUTE_ADMIN') ? (
                    <Badge variant="secondary" className="items-center gap-1 rounded-full border-transparent bg-sky-50 text-xs font-bold text-sky-700 mt-0.5 hover:bg-sky-50">
                      <UserCheck className="size-3.5" /> Admin
                    </Badge>
                  ) : hasRole(record.user?.role, 'TEACHER') ? (
                    <Badge variant="secondary" className="items-center gap-1 rounded-full border-transparent bg-purple-50 text-xs font-bold text-purple-700 mt-0.5 hover:bg-purple-50">
                      <UserCheck className="size-3.5" /> Teacher
                    </Badge>
                  ) : (
                    <span className="text-surface-400">-</span>
                  )}
                </div>
                {selectedRole === 'STUDENT' && (
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-surface-400 font-bold">Class / Section</span>
                    <span className="font-semibold block mt-0.5">
                      {hasRole(record.user?.role, 'STUDENT') && record.user?.studentProfile?.section?.class ? (
                        `${record.user.studentProfile.section.class.name}${record.user.studentProfile.section.name ? ` - ${record.user.studentProfile.section.name}` : ''}`
                      ) : (
                        '-'
                      )}
                    </span>
                  </div>
                )}
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-surface-400 font-bold">Date</span>
                  <span className="font-semibold block mt-0.5">{new Date(record.date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-surface-400 font-bold">Remarks</span>
                  <span className="font-semibold block mt-0.5">{record.remarks || '-'}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-surface-100">
                {record.user?.id ? (
                  <Link
                    to={hasRole(record.user.role, 'STUDENT') ? `/school/admin/students/${record.user.id}` : `/school/admin/teachers/${record.user.id}`}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 text-surface-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 text-xs font-bold"
                  >
                    <Eye className="size-3.5" />
                    <span>View Profile</span>
                  </Link>
                ) : (
                  <span className="text-xs text-surface-400">No profile link</span>
                )}
              </div>
            </div>
          ))
        )}
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
