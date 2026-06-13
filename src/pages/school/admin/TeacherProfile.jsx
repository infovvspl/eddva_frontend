import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, BookOpen, Calendar, BarChart2, Briefcase, 
  Mail, Smartphone, MapPin, ArrowLeft, Download, 
  Edit2, Clock, CheckCircle, Award, Globe, Building,
  Printer, Share2, Loader2, FileText
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToPDF } from "@/lib/school/pdfExport";
import { toast } from 'sonner';
import { cn } from '@/components/school/admin/Skeleton';

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-200
      ${active 
        ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' 
        : 'border-transparent bg-transparent text-slate-500 hover:border-slate-100 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900/70 dark:hover:text-white'}
    `}
  >
    <Icon size={18} />
    {label}
  </button>
);

const DetailItem = ({ label, value, icon: Icon }) => (
  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
    <div className="flex items-center gap-2 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">
      {Icon && <Icon size={12} />}
      {label}
    </div>
    <div className="text-sm font-bold text-slate-900 dark:text-white">{value || '—'}</div>
  </div>
);

export default function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  // Attendance states
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const toggleActiveStatus = async () => {
    setUpdatingStatus(true);
    try {
      const newActive = !teacher.isActive;
      await api.put(`/teachers/${teacher.id}`, { 
        name: teacher.name,
        isActive: newActive 
      });
      setTeacher(prev => ({ ...prev, isActive: newActive }));
      toast.success(`Teacher account ${newActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update teacher status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    fetchTeacher();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'attendance' && teacher?.id) {
      fetchAttendance();
    }
  }, [activeTab, attendanceMonth, teacher?.id]);

  const fetchAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const [year, month] = attendanceMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      const res = await api.get('/attendance', {
        params: { userId: teacher.id, startDate, endDate },
      });
      const list = res.data?.data ?? res.data ?? [];
      setAttendance(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Attendance fetch error:', err);
      setAttendance([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchTeacher = async () => {
    try {
      const res = await api.get(`/teachers/${id}`);
      setTeacher(res.data?.data ?? res.data);
    } catch (err) {
      console.error(err);
      setTeacher(null);
    } finally {
      setLoading(false);
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportToPDF('teacher-profile-content', `Teacher_Profile_${teacher.name.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF report generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Loading Profile...</div>;
  if (!teacher) return <div className="p-8 text-center text-red-500">Teacher not found.</div>;

  const profile = teacher.teacherProfile || {};

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
        >
          <ArrowLeft size={20} />
          Back to List
        </button>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold tracking-tight uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Export PDF
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <Printer size={18} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Profile Card for Export */}
      <div id="teacher-profile-content" className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden mb-8">
        <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-700" />
        <div className="px-12 pb-12 -mt-20">
          <div className="flex flex-col md:flex-row items-end gap-8 mb-8">
            <div className="w-48 h-48 rounded-[3rem] border-8 border-white dark:border-slate-950 overflow-hidden bg-slate-100 shadow-2xl">
              {teacher.profileImage ? (
                <img src={teacher.profileImage} alt={teacher.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-600/10 text-5xl font-bold tracking-tight text-blue-700">
                  {(teacher.name || 'T').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-4 mb-2 flex-wrap">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight">{teacher.name}</h1>
                <button
                  onClick={toggleActiveStatus}
                  disabled={updatingStatus}
                  className="flex items-center gap-2 outline-none group cursor-pointer"
                  title="Click to toggle account status"
                >
                  <div className={cn(
                    "relative w-11 h-6 rounded-full transition-colors duration-300 flex items-center px-1 border",
                    teacher.isActive 
                      ? "bg-emerald-500 border-emerald-600" 
                      : "bg-slate-300 border-slate-400 dark:bg-slate-800 dark:border-slate-700"
                  )}>
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-md",
                      teacher.isActive ? "translate-x-5" : "translate-x-0"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold tracking-tight uppercase tracking-widest",
                    teacher.isActive ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {teacher.isActive ? 'Active' : 'Inactive'}
                  </span>
                </button>
              </div>
              <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500">
                <div className="flex items-center gap-2"><Briefcase size={18} className="text-blue-500" /> {profile.role || 'Designation not set'}</div>
                <div className="flex items-center gap-2"><Building size={18} className="text-blue-500" /> {profile.department || 'Department not set'}</div>
                <div className="flex items-center gap-2"><Mail size={18} className="text-blue-500" /> {teacher.email}</div>
              </div>
            </div>
            <div className="pb-4 hidden lg:block text-right">
              <div className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">Employee ID</div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tighter">{profile.employeeId || '—'}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-slate-100 dark:border-slate-800 -mx-12 mb-8 px-12 pb-6 overflow-x-auto no-scrollbar">
            <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} icon={User} label="Personal Details" />
            <TabButton active={activeTab === 'academic'} onClick={() => setActiveTab('academic')} icon={BookOpen} label="Subjects & Classes" />
            <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={Calendar} label="Attendance" />
            <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} icon={BarChart2} label="Performance" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'personal' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-8">
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Core Identification</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Full Name" value={teacher.name} icon={User} />
                        <DetailItem label="Joining Date" value={profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : '—'} icon={Clock} />
                        <DetailItem label="Qualifications" value={profile.qualifications} icon={Award} className="col-span-2" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Contact Info</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Work Email" value={teacher.email} icon={Mail} />
                        <DetailItem label="Phone Number" value={teacher.phone} icon={Smartphone} />
                        <DetailItem label="Nationality" value={profile.nationality} icon={Globe} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xl">
                      <h4 className="text-xs font-bold tracking-tight uppercase tracking-widest opacity-60 mb-4">Department Lead Info</h4>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white/60">
                        No department lead assigned.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Academic Assignments</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {profile.assignments && profile.assignments.length > 0 ? (
                        profile.assignments.map((ass, i) => (
                          <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                                <BookOpen size={20} />
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-slate-900 dark:text-white">
                                  {ass.className || '—'} &rarr; Section {ass.sectionName || '—'}
                                </span>
                                <span className="block text-xs font-semibold text-slate-500 mt-0.5">
                                  Subject: <strong className="text-blue-600 dark:text-sky-400 font-bold">{ass.subjectName || 'No Specific Subject'}</strong>
                                </span>
                              </div>
                            </div>
                            {ass.isClassTeacher && (
                              <span className="bg-emerald-500/10 text-emerald-700 dark:text-sky-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest">
                                Class Teacher
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400 border border-dashed border-slate-100 dark:border-slate-850 rounded-2xl md:col-span-2">
                          No active academic assignments found.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Class Management Summary</h3>
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                      <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-xs font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">Unique Classes</div>
                        <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{teacher.classes?.length || 0}</div>
                      </div>
                      <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-xs font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">Unique Sections</div>
                        <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{teacher.sections?.length || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  {/* Month Picker */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">Attendance Record</h3>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-400 uppercase">Month</label>
                      <input
                        type="month"
                        value={attendanceMonth}
                        onChange={(e) => setAttendanceMonth(e.target.value)}
                        className="rounded-xl border-2 border-slate-100 dark:border-slate-700 px-3 py-2 text-sm font-bold text-slate-700 dark:text-white bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {attendanceLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 size={32} className="animate-spin text-blue-500" />
                    </div>
                  ) : (() => {
                    const total   = attendance.length;
                    const present = attendance.filter(r => (r.status || '').toUpperCase() === 'PRESENT').length;
                    const absent  = attendance.filter(r => (r.status || '').toUpperCase() === 'ABSENT').length;
                    const late    = attendance.filter(r => (r.status || '').toUpperCase() === 'LATE').length;
                    const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

                    const statusStyle = (status) => {
                      const s = (status || '').toUpperCase();
                      if (s === 'PRESENT') return 'bg-emerald-500/10 text-emerald-600';
                      if (s === 'ABSENT')  return 'bg-red-500/10 text-red-500';
                      if (s === 'LATE')    return 'bg-amber-400/10 text-amber-600';
                      if (s === 'LEAVE')   return 'bg-blue-500/10 text-blue-600';
                      return 'bg-slate-100 text-slate-500';
                    };

                    return (
                      <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                            <div className={`text-4xl font-bold tracking-tight mb-1 ${pct >= 75 ? 'text-blue-600' : 'text-red-500'}`}>{total > 0 ? `${pct}%` : '—'}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance %</div>
                          </div>
                          <div className="p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-600">
                            <div className="text-4xl font-bold tracking-tight mb-1">{present}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest">Present</div>
                          </div>
                          <div className="p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-center text-red-500">
                            <div className="text-4xl font-bold tracking-tight mb-1">{absent}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest">Absent</div>
                          </div>
                          <div className="p-6 rounded-[2rem] bg-amber-400/10 border border-amber-400/20 text-center text-amber-600">
                            <div className="text-4xl font-bold tracking-tight mb-1">{late}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest">Late</div>
                          </div>
                        </div>

                        {/* Records Table */}
                        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                              <tr>
                                <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Day</th>
                                <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                              {attendance.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-10 text-center text-slate-400 font-bold">
                                    No attendance records for this month.
                                  </td>
                                </tr>
                              ) : (
                                [...attendance]
                                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                                  .map((record, i) => {
                                    const d = new Date(record.date);
                                    return (
                                      <tr key={record.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="p-4 font-bold text-slate-700 dark:text-slate-200">
                                          {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-4 font-bold text-slate-400">
                                          {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                                        </td>
                                        <td className="p-4">
                                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusStyle(record.status)}`}>
                                            {record.status || 'Unknown'}
                                          </span>
                                        </td>
                                        <td className="p-4 text-slate-400 font-bold">{record.remarks || '—'}</td>
                                      </tr>
                                    );
                                  })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'performance' && (() => {
                const pct = teacher.performance?.avgStudentScore ?? 0;
                const totalTests = teacher.performance?.totalTestsCount || 0;
                const hasPerformance = totalTests > 0;
                const strokeDashoffset = 440 - (440 * pct) / 100;

                return (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="md:col-span-2 p-8 rounded-[2.5rem] bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/50 shadow-xl">
                        <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-6">Student Success Rate</h4>
                        <div className="flex items-center gap-12 flex-wrap md:flex-nowrap">
                          <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                             <svg className="w-full h-full -rotate-90">
                                <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="20" className="dark:stroke-slate-800" />
                                <circle cx="80" cy="80" r="70" fill="none" stroke="#2563eb" strokeWidth="20" strokeDasharray="440" strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                             </svg>
                             <div className="absolute text-center">
                                <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{pct}%</div>
                                <div className="text-[10px] font-bold tracking-tight text-slate-400 uppercase">Avg Accuracy</div>
                             </div>
                          </div>
                          <div className="flex-1 space-y-4 min-w-[200px]">
                             <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Average Performance</span>
                                <span className="text-sm font-bold tracking-tight text-blue-600 dark:text-blue-400">{pct}%</span>
                             </div>
                             <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
                             </div>
                             <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Evaluated Sessions</span>
                                <span className="text-sm font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{totalTests}</span>
                             </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 rounded-[2.5rem] bg-blue-600 text-white text-center flex flex-col justify-center shadow-xl shadow-blue-600/20">
                         <Award size={48} className="mx-auto mb-4 opacity-40" />
                         <h4 className="text-xl font-bold tracking-tight mb-1">
                           {hasPerformance ? 'Performance Available' : 'No Performance Data'}
                         </h4>
                         <p className="text-xs font-bold opacity-70 uppercase tracking-widest">
                           {hasPerformance ? 'Based on evaluated sessions' : 'No evaluated sessions yet'}
                         </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
