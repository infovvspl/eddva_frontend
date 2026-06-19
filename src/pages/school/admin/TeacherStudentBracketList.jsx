import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, GraduationCap, Award, Loader2, Download, ExternalLink } from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

const BRACKET_CONFIGS = {
  outstanding: {
    title: 'Outstanding',
    range: '80%+',
    filterFn: (avg) => avg >= 80,
    textColor: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/10',
    borderColor: 'border-emerald-100 dark:border-emerald-900/50',
    barBg: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
    glowColor: 'shadow-emerald-500/10'
  },
  'above-average': {
    title: 'Above Average',
    range: '70% - 79%',
    filterFn: (avg) => avg >= 70 && avg < 80,
    textColor: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/10',
    borderColor: 'border-blue-100 dark:border-blue-900/50',
    barBg: 'bg-blue-500',
    gradient: 'from-blue-500 to-indigo-600',
    glowColor: 'shadow-blue-500/10'
  },
  'high-average': {
    title: 'High Average',
    range: '60% - 69%',
    filterFn: (avg) => avg >= 60 && avg < 70,
    textColor: 'text-indigo-700 dark:text-indigo-400',
    bgColor: 'bg-indigo-50/50 dark:bg-indigo-950/10',
    borderColor: 'border-indigo-100 dark:border-indigo-900/50',
    barBg: 'bg-indigo-500',
    gradient: 'from-indigo-500 to-purple-600',
    glowColor: 'shadow-indigo-500/10'
  },
  average: {
    title: 'Average',
    range: '50% - 59%',
    filterFn: (avg) => avg >= 50 && avg < 60,
    textColor: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50/50 dark:bg-amber-950/10',
    borderColor: 'border-amber-100 dark:border-amber-900/50',
    barBg: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-600',
    glowColor: 'shadow-amber-500/10'
  },
  poor: {
    title: 'Poor',
    range: '< 50%',
    filterFn: (avg) => avg < 50,
    textColor: 'text-rose-700 dark:text-rose-400',
    bgColor: 'bg-rose-50/50 dark:bg-rose-950/10',
    borderColor: 'border-rose-100 dark:border-rose-900/50',
    barBg: 'bg-rose-500',
    gradient: 'from-rose-500 to-red-600',
    glowColor: 'shadow-rose-500/10'
  }
};

export default function TeacherStudentBracketList() {
  const { id, bracket } = useParams();
  const navigate = useNavigate();
  
  const [teacher, setTeacher] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const config = BRACKET_CONFIGS[bracket] || {
    title: bracket ? bracket.charAt(0).toUpperCase() + bracket.slice(1) : 'Bracket',
    range: '',
    filterFn: () => true,
    textColor: 'text-slate-700 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-900/50',
    borderColor: 'border-slate-100 dark:border-slate-800',
    barBg: 'bg-slate-500',
    gradient: 'from-slate-500 to-slate-600',
    glowColor: 'shadow-slate-500/10'
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teacherRes, reportRes] = await Promise.all([
        api.get(`/teachers/${id}`),
        api.get('/reports/class', { params: { teacherUserId: id } })
      ]);
      setTeacher(teacherRes.data?.data ?? teacherRes.data);
      setPerformanceData(reportRes.data);
    } catch (err) {
      console.error('Failed to fetch data for bracket list:', err);
      toast.error('Failed to load performance details');
    } finally {
      setLoading(false);
    }
  };

  const studentsList = useMemo(() => {
    if (!performanceData?.students) return [];
    return performanceData.students.filter(
      (s) => s.isEvaluated && config.filterFn(s.avgScore)
    );
  }, [performanceData, config]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentsList;
    const query = searchQuery.toLowerCase();
    return studentsList.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(query)) ||
        (s.class && s.class.toLowerCase().includes(query))
    );
  }, [studentsList, searchQuery]);

  const downloadCSV = () => {
    if (!filteredStudents.length) return;
    const headers = ['Student Name', 'Enrollment No.', 'Class/Section', 'Average Score %', 'Attendance %'];
    const rows = filteredStudents.map((s) => [
      s.name,
      s.enrollmentNo || '-',
      s.class || '-',
      `${Math.round(s.avgScore)}%`,
      s.attendance !== undefined ? `${s.attendance}%` : '-'
    ]);
    
    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${teacher?.name || 'Teacher'}_${config.title}_Students.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Bracket Details...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full pb-12">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/school/admin/teachers/${id}?tab=performance`)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors outline-none"
        >
          <ArrowLeft size={20} />
          Back to Teacher Profile
        </button>
      </div>

      {/* Main Header Container */}
      <div className={`p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br ${config.gradient} text-white shadow-xl ${config.glowColor} mb-8`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                Bracket: {config.title} ({config.range})
              </span>
              {teacher && (
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-black/15 px-3 py-1 rounded-full">
                  Teacher: {teacher.name}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {config.title} Students
            </h1>
            <p className="text-white/80 text-xs md:text-sm font-semibold mt-2 max-w-xl">
              Displaying all graded students currently achieving an average evaluated performance score in the range of {config.range}.
            </p>
          </div>

          <div className="flex gap-4 shrink-0">
            <div className="px-6 py-4 rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[120px]">
              <div className="text-3xl font-black">{studentsList.length}</div>
              <div className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">Students</div>
            </div>
            <div className="px-6 py-4 rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[120px]">
              <div className="text-3xl font-black">
                {studentsList.length > 0
                  ? `${Math.round(studentsList.reduce((sum, s) => sum + s.avgScore, 0) / studentsList.length)}%`
                  : '—'}
              </div>
              <div className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">Bracket Avg</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Controls */}
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, class or enrollment..."
              className="w-full rounded-2xl border border-slate-150 bg-white dark:border-slate-800 dark:bg-slate-900 py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <button
            type="button"
            disabled={!filteredStudents.length}
            onClick={downloadCSV}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-700 shadow-sm transition disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* The List/Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/40 text-slate-500 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest">Student Name</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Enrollment No.</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Class/Section</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-center">Attendance</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-right">Avg Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-slate-400 font-bold">
                    No students in this bracket matching the search query.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-all duration-150"
                  >
                    <td className="px-8 py-4.5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {student.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            to={`/school/admin/students/${student.id}`}
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 group transition-colors"
                          >
                            {student.name}
                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 font-bold text-slate-600 dark:text-slate-400">
                      {student.enrollmentNo || '-'}
                    </td>
                    <td className="px-6 py-4.5 font-bold text-slate-600 dark:text-slate-400">
                      {student.class || '-'}
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      {student.attendance !== undefined ? (
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          student.attendance >= 75
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {student.attendance}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-8 py-4.5 text-right font-black text-base">
                      <span className={config.textColor}>
                        {Math.round(student.avgScore)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
