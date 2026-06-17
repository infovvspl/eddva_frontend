import React, { useState, useEffect, useMemo } from 'react';
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
import { normalizeSubjectName } from '@/lib/utils';

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

const DetailItem = ({ label, value, icon: Icon, className }) => (
  <div className={cn("p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800", className)}>
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

  // Performance states
  const [performanceData, setPerformanceData] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'performance' && teacher?.id) {
      fetchPerformanceData();
    }
  }, [activeTab, teacher?.id]);

  const fetchPerformanceData = async () => {
    setPerformanceLoading(true);
    try {
      const res = await api.get('/reports/class', {
        params: { teacherUserId: id }
      });
      setPerformanceData(res.data?.data ?? res.data);
    } catch (err) {
      console.error('Failed to fetch performance report:', err);
      toast.error('Failed to load performance analytics');
      setPerformanceData(null);
    } finally {
      setPerformanceLoading(false);
    }
  };

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
  const docs = profile.docs || {};
  const teacherDetails = docs.teacherDetails || docs.profileDetails || {};
  const detailValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');
  const qualificationText = detailValue(
    profile.qualifications,
    [profile.qualification || teacherDetails.qualification, profile.degree || teacherDetails.degree, profile.specialization || teacherDetails.specialization]
      .filter(Boolean)
      .join(' | ')
  );

  const uniqueAssignments = useMemo(() => {
    if (!profile.assignments) return [];
    const seen = new Set();
    return profile.assignments.filter(ass => {
      const normalizedSub = normalizeSubjectName(ass.subjectName || '');
      const key = `${ass.className || ''}_${ass.sectionName || ''}_${normalizedSub}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [profile.assignments]);

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
                        <DetailItem label="Qualifications" value={profile.qualifications} icon={Award} />
                        <DetailItem label="Nationality" value={profile.nationality} icon={Globe} />
                        <DetailItem label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : '—'} icon={Calendar} />
                        <DetailItem label="Gender" value={profile.gender} icon={User} />
                        <DetailItem label="Blood Group" value={profile.bloodGroup} icon={CheckCircle} />
                        <DetailItem label="Marital Status" value={profile.maritalStatus} icon={User} />
                        <DetailItem label="National ID" value={profile.nationalId} icon={FileText} />
                        <DetailItem label="Nationality" value={detailValue(profile.nationality, teacherDetails.nationality)} icon={Globe} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Academic Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Qualifications" value={qualificationText} icon={Award} className="col-span-2" />
                        <DetailItem label="University / Institute" value={detailValue(profile.institute, teacherDetails.institute)} icon={Building} />
                        <DetailItem label="Passing Year" value={detailValue(profile.passingYear, teacherDetails.passingYear)} icon={Clock} />
                        <DetailItem label="Languages Known" value={detailValue(profile.languages, teacherDetails.languages)} icon={Globe} className="col-span-2" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Professional Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Designation" value={profile.role} icon={Briefcase} />
                        <DetailItem label="Employment Type" value={detailValue(profile.employmentType, teacherDetails.employmentType)} icon={Briefcase} />
                        <DetailItem label="Experience" value={profile.experience ? `${profile.experience} years` : null} icon={Clock} />
                        <DetailItem label="Salary" value={profile.salary} icon={FileText} />
                        <DetailItem label="Achievements" value={detailValue(profile.achievements, teacherDetails.achievements)} icon={Award} className="col-span-2" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Contact Info</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Work Email" value={teacher.email} icon={Mail} />
                        <DetailItem label="Phone Number" value={teacher.phone} icon={Smartphone} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Address Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Address" value={profile.currentAddress} icon={MapPin} />
                        <DetailItem label="City" value={profile.city} icon={Building} />
                        <DetailItem label="State" value={profile.state} icon={Building} />
                        <DetailItem label="Country" value={profile.country} icon={Globe} />
                        <DetailItem label="Pin Code" value={profile.pinCode} icon={MapPin} />
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
                      {uniqueAssignments && uniqueAssignments.length > 0 ? (
                        uniqueAssignments.map((ass, i) => (
                          <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                                <BookOpen size={20} />
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-slate-900 dark:text-white">
                                  {ass.className && !ass.className.toLowerCase().startsWith('class') ? 'Class ' : ''}{ass.className || '—'} - {ass.sectionName || '—'}
                                </span>
                                <span className="block text-xs font-semibold text-slate-500 mt-0.5">
                                  {normalizeSubjectName(ass.subjectName) || 'No Specific Subject'}
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
                    const total = attendance.length;
                    const present = attendance.filter(r => (r.status || '').toUpperCase() === 'PRESENT').length;
                    const absent = attendance.filter(r => (r.status || '').toUpperCase() === 'ABSENT').length;
                    const late = attendance.filter(r => (r.status || '').toUpperCase() === 'LATE').length;
                    const pct = total > 0 ? Math.round((present / total) * 100) : 0;

                    const statusStyle = (status) => {
                      const s = (status || '').toUpperCase();
                      if (s === 'PRESENT') return 'bg-emerald-500/10 text-emerald-600';
                      if (s === 'ABSENT') return 'bg-red-500/10 text-red-500';
                      if (s === 'LATE') return 'bg-amber-400/10 text-amber-600';
                      if (s === 'LEAVE') return 'bg-blue-500/10 text-blue-600';
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
                if (performanceLoading) {
                  return (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <Loader2 size={40} className="animate-spin text-blue-600" />
                      <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Calculating performance analytics...</p>
                    </div>
                  );
                }

                const studentsList = performanceData?.students || [];
                const evaluatedStudents = studentsList.filter(s => s.isEvaluated);
                const totalEvaluated = evaluatedStudents.length;

                if (totalEvaluated === 0) {
                  return (
                    <div className="p-12 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-center shadow-sm">
                      <Award size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700 animate-bounce" />
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No assessments evaluated yet.</h4>
                      <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto">
                        Student performance metrics will appear here once assessments are created, completed, and graded for the classes assigned to this teacher.
                      </p>
                    </div>
                  );
                }

                const overallAverage = Math.round(
                  evaluatedStudents.reduce((sum, s) => sum + s.avgScore, 0) / totalEvaluated
                );

                const categories = {
                  outstanding: evaluatedStudents.filter(s => s.avgScore > 80),
                  aboveAverage: evaluatedStudents.filter(s => s.avgScore >= 70 && s.avgScore <= 80),
                  highAverage: evaluatedStudents.filter(s => s.avgScore >= 60 && s.avgScore < 70),
                  average: evaluatedStudents.filter(s => s.avgScore >= 50 && s.avgScore < 60),
                  poor: evaluatedStudents.filter(s => s.avgScore < 50)
                };

                const categoryConfig = [
                  {
                    key: 'outstanding',
                    title: 'Outstanding',
                    range: '> 80%',
                    students: categories.outstanding,
                    bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/10',
                    borderColor: 'border-emerald-100 dark:border-emerald-900/50',
                    textColor: 'text-emerald-700 dark:text-emerald-400',
                    barBg: 'bg-emerald-500',
                    glowColor: 'shadow-emerald-500/10'
                  },
                  {
                    key: 'aboveAverage',
                    title: 'Above Average',
                    range: '70% - 80%',
                    students: categories.aboveAverage,
                    bgColor: 'bg-blue-50/50 dark:bg-blue-950/10',
                    borderColor: 'border-blue-100 dark:border-blue-900/50',
                    textColor: 'text-blue-700 dark:text-blue-400',
                    barBg: 'bg-blue-500',
                    glowColor: 'shadow-blue-500/10'
                  },
                  {
                    key: 'highAverage',
                    title: 'High Average',
                    range: '60% - 70%',
                    students: categories.highAverage,
                    bgColor: 'bg-indigo-50/50 dark:bg-indigo-950/10',
                    borderColor: 'border-indigo-100 dark:border-indigo-900/50',
                    textColor: 'text-indigo-700 dark:text-indigo-400',
                    barBg: 'bg-indigo-500',
                    glowColor: 'shadow-indigo-500/10'
                  },
                  {
                    key: 'average',
                    title: 'Average',
                    range: '50% - 60%',
                    students: categories.average,
                    bgColor: 'bg-amber-50/50 dark:bg-amber-950/10',
                    borderColor: 'border-amber-100 dark:border-amber-900/50',
                    textColor: 'text-amber-700 dark:text-amber-400',
                    barBg: 'bg-amber-500',
                    glowColor: 'shadow-amber-500/10'
                  },
                  {
                    key: 'poor',
                    title: 'Poor',
                    range: '< 50%',
                    students: categories.poor,
                    bgColor: 'bg-rose-50/50 dark:bg-rose-950/10',
                    borderColor: 'border-rose-100 dark:border-rose-900/50',
                    textColor: 'text-rose-700 dark:text-rose-400',
                    barBg: 'bg-rose-500',
                    glowColor: 'shadow-rose-500/10'
                  }
                ];

                return (
                  <div className="space-y-10">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 p-8 rounded-[2.5rem] bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/50 shadow-xl flex items-center justify-between gap-8 flex-wrap md:flex-nowrap">
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">Class Performance</h4>
                          <p className="text-slate-500 text-xs font-semibold">
                            Aggregated metrics of students assigned to classes and sections taught by this teacher.
                          </p>
                        </div>
                        <div className="flex items-center gap-10 flex-wrap shrink-0">
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                              <circle cx="64" cy="64" r="54" fill="none" stroke="#f1f5f9" strokeWidth="12" className="dark:stroke-slate-800" />
                              <circle cx="64" cy="64" r="54" fill="none" stroke="#2563eb" strokeWidth="12" strokeDasharray="340" strokeDashoffset={340 - (340 * overallAverage) / 100} strokeLinecap="round" />
                            </svg>
                            <div className="absolute text-center">
                              <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{overallAverage}%</div>
                              <div className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">Class Avg</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/10 flex flex-col justify-center space-y-4">
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Total Graded Students</h4>
                          <div className="text-5xl font-black mt-1">{totalEvaluated}</div>
                        </div>
                        <p className="text-xs text-blue-100 font-semibold leading-relaxed">
                          Students with at least one evaluation in classes mapped to this teacher profile.
                        </p>
                      </div>
                    </div>

                    {/* Categories Section */}
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-6">Performance Tiers</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {categoryConfig.map(cat => {
                          const pct = totalEvaluated > 0 ? Math.round((cat.students.length / totalEvaluated) * 100) : 0;
                          return (
                            <div
                              key={cat.key}
                              className={`p-5 rounded-3xl border ${cat.borderColor} ${cat.bgColor} flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all duration-300`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className={`text-sm font-bold tracking-tight ${cat.textColor}`}>{cat.title}</h5>
                                  <span className="text-[10px] font-bold text-slate-400 tracking-wider bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-1.5 py-0.5 rounded">
                                    {cat.range}
                                  </span>
                                </div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">
                                  {cat.students.length} <span className="text-xs text-slate-400 font-bold">student{cat.students.length !== 1 ? 's' : ''}</span>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <div className="h-1.5 bg-slate-200/60 dark:bg-slate-850 rounded-full overflow-hidden">
                                  <div className={`h-full ${cat.barBg}`} style={{ width: `${pct}%` }} />
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                                  <span>Share of class</span>
                                  <span>{pct}%</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Student List</div>
                                {cat.students.length > 0 ? (
                                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                                    {cat.students.map(std => (
                                      <div
                                        key={std.id}
                                        className="flex items-center justify-between gap-2 text-xs font-semibold py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded px-1.5 transition-colors"
                                      >
                                        <span className="text-slate-700 dark:text-slate-300 truncate" title={std.name}>
                                          {std.name}
                                        </span>
                                        <span className={`text-[10px] font-bold ${cat.textColor}`}>
                                          {Math.round(std.avgScore)}%
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-bold text-slate-400 italic py-2">
                                    No students
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
