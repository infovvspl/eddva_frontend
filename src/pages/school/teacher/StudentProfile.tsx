import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Users, GraduationCap, FileCheck, Calendar, Mail, Smartphone,
  MapPin, HeartPulse, Shield, FileText, Download, Loader2, AlertCircle, Clock, CheckCircle,
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { exportToPDF } from '@/lib/school/pdfExport';
import { cn } from '@/lib/utils';

/**
 * Read-only student detail view for teachers — same underlying data as the
 * admin StudentProfile (GET /students/:id, already scoped server-side to a
 * teacher's own assigned sections), minus every admin write action (edit,
 * deactivate, send credentials, document verification, exit workflow). Kept
 * as its own file rather than reusing the admin page with role-gating: that
 * page has write controls scattered across many spots (header status
 * toggle, per-tab buttons, per-document approve/reject), and gating every
 * one individually is exactly the kind of thing that's easy to miss one of.
 * A page that never imports the write actions in the first place can't leak
 * one.
 */

const TABS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'family', label: 'Family Details', icon: Users },
  { id: 'academic', label: 'Academic', icon: GraduationCap },
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'documents', label: 'Documents', icon: FileCheck },
] as const;

const getInitials = (name?: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const DetailItem = ({ label, value, icon: Icon, className }: { label: string; value?: React.ReactNode; icon?: any; className?: string }) => (
  <div className={cn('p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 min-w-0 overflow-hidden', className)}>
    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">
      {Icon && <Icon size={12} className="shrink-0" />}
      <span className="truncate">{label}</span>
    </div>
    <div className="text-sm font-bold text-slate-900 dark:text-white break-words">{value || '—'}</div>
  </div>
);

const DOCUMENT_NAMES = [
  'Birth Certificate', 'Aadhaar Card', 'Medical / Health Record', 'Transfer Certificate (TC)',
  'Previous Report Card', 'Character Certificate', 'Fee Clearance Certificate', 'Migration Certificate',
  'Promotion / Pass Certificate', 'Parent / Guardian ID', 'Address Proof', 'Caste / Category Certificate',
];

const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('personal');
  const [teachingMap, setTeachingMap] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/students/${id}`);
        const raw = res.data?.data ?? res.data;
        setStudent(raw);
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.response?.data?.message || 'Student not found.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStudent();
  }, [id]);

  useEffect(() => {
    const sectionId = student?.studentProfile?.sectionId || student?.section_id;
    if (activeTab !== 'academic' || !sectionId) {
      setTeachingMap(null);
      return;
    }
    api.get(`/academic/sections/${sectionId}/teaching-map`)
      .then((res) => setTeachingMap(res.data?.data ?? res.data))
      .catch(() => setTeachingMap(null));
  }, [activeTab, student]);

  useEffect(() => {
    if (activeTab !== 'attendance' || !student?.id) return;
    const fetchAttendance = async () => {
      setAttendanceLoading(true);
      try {
        const [year, month] = attendanceMonth.split('-');
        const startDate = `${year}-${month}-01`;
        const lastDay = new Date(Number(year), Number(month), 0).getDate();
        const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        const res = await api.get('/attendance', { params: { userId: student.id, startDate, endDate } });
        const list = res.data?.data ?? res.data ?? [];
        setAttendance(Array.isArray(list) ? list : []);
      } catch {
        setAttendance([]);
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchAttendance();
  }, [activeTab, attendanceMonth, student?.id]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportToPDF('teacher-student-profile-content', `${student?.name || 'student'}-profile.pdf`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Loading Profile...</div>;
  }

  if (!student || error) {
    return (
      <div className="p-12 text-center">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-red-50 border border-red-100 shadow-xl shadow-red-200/20">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold tracking-tight text-red-900 mb-2">Student Not Found</h2>
          <p className="text-sm font-bold text-red-600 mb-6">{error || "We couldn't find this student profile."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // studentProfile carries both snake_case (raw SQL) and any already-camelCase
  // fields, matching the /students/:id response shape.
  const profile = student.studentProfile || {};
  const dob = profile.dob;
  const bloodGroup = profile.bloodGroup || profile.blood_group;
  const nationalId = profile.nationalId || profile.national_id;
  const address = profile.address;
  const city = profile.city;
  const state = profile.state;
  const pinCode = profile.pinCode || profile.pin_code;
  const medicalConditions = profile.medicalConditions || profile.medical_conditions;
  const allergies = profile.allergies;
  const fatherName = profile.fatherName || profile.father_name;
  const fatherPhone = profile.fatherPhone || profile.father_phone;
  const motherName = profile.motherName || profile.mother_name;
  const motherPhone = profile.motherPhone || profile.mother_phone;
  const parentPhone = profile.parentPhone || profile.parent_phone;
  const parentEmail = profile.parentEmail || profile.parent_email;
  const parentOccupation = profile.parentOccupation || profile.parent_occupation;
  const className = profile.section?.class?.name || profile.class_name;
  const sectionName = profile.section?.name || profile.section_name;
  const rollNo = profile.rollNo || profile.roll_no;
  const enrollmentNo = profile.enrollmentNo || profile.enrollment_no;
  const admissionDate = profile.admissionDate || profile.admission_date;
  const documents = profile.documents || {};
  const documentVerification = profile.documentVerification || {};

  return (
    <div className="w-full pb-24 sm:pb-36">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors text-sm self-start"
        >
          <ArrowLeft size={18} /> Back to Students
        </button>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Export PDF
        </button>
      </div>

      <div id="teacher-student-profile-content" className="bg-white dark:bg-slate-950 rounded-3xl sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden mb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-white/30 bg-white/10 backdrop-blur-md overflow-hidden shadow-xl shrink-0 flex items-center justify-center">
              {student.profileImage ? (
                <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white">
                  {getInitials(student.name)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight break-words">{student.name}</h1>
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider',
                  (student.isActive ?? student.is_active) ? 'bg-emerald-500/90 border-emerald-400' : 'bg-slate-800/90 border-slate-600 text-slate-200',
                )}>
                  {(student.isActive ?? student.is_active) ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-blue-100">
                <span className="bg-white/15 px-2.5 py-1 rounded-xl backdrop-blur-sm border border-white/10">
                  {className ? `${className.toLowerCase().startsWith('class') ? className : `Class ${className}`} / ${sectionName || '—'}` : '—'}
                </span>
                {student.email && <span className="bg-white/15 px-2.5 py-1 rounded-xl backdrop-blur-sm border border-white/10 truncate max-w-[220px]">{student.email}</span>}
              </div>
            </div>
            {enrollmentNo && (
              <div className="text-center sm:text-right shrink-0 bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-[9px] font-bold tracking-widest text-blue-200 uppercase mb-0.5">Enrollment No</div>
                <div className="text-base font-black tracking-tight">{enrollmentNo}</div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-10 pt-6 pb-10 sm:pb-14">
          <div className="flex flex-nowrap gap-2 border-b border-slate-100 dark:border-slate-800 mb-6 pb-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={cn(
                  'flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap shrink-0',
                  activeTab === tabId
                    ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                    : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900/70 dark:hover:text-white',
                )}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">Identity Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem label="Full Name" value={student.name} icon={User} />
                    <DetailItem label="Date of Birth" value={dob ? new Date(dob).toLocaleDateString() : undefined} icon={Calendar} />
                    <DetailItem label="Gender" value={profile.gender} icon={User} />
                    <DetailItem label="Blood Group" value={bloodGroup} icon={HeartPulse} />
                    <DetailItem label="National ID" value={nationalId} icon={Shield} />
                    <DetailItem label="Admission Date" value={admissionDate ? new Date(admissionDate).toLocaleDateString() : undefined} icon={Clock} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem label="Primary Email" value={student.email} icon={Mail} />
                    <DetailItem label="Phone Number" value={student.phone} icon={Smartphone} />
                    <DetailItem label="Address" value={[address, city, state, pinCode].filter(Boolean).join(', ')} icon={MapPin} className="sm:col-span-2" />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-80">Medical Alert</h4>
                    <AlertCircle size={20} />
                  </div>
                  <p className="text-sm font-bold leading-relaxed mb-4">
                    {medicalConditions || 'No significant medical conditions reported.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-lg bg-white/20 text-[10px] font-bold uppercase">Blood: {bloodGroup || '—'}</span>
                    <span className="px-2 py-1 rounded-lg bg-white/20 text-[10px] font-bold uppercase">Allergy: {allergies || 'None'}</span>
                  </div>
                </div>
                <div className="p-6 rounded-3xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} /> Enrollment Status
                  </h4>
                  <p className="text-sm font-extrabold text-blue-950 dark:text-blue-100">
                    {profile.status || ((student.isActive ?? student.is_active) ? 'ACTIVE' : 'INACTIVE')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'family' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Family & Guardian Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><User size={20} /></div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Father's Details</h4>
                  </div>
                  <DetailItem label="Name" value={fatherName} />
                  <DetailItem label="Phone Number" value={fatherPhone || parentPhone} />
                </div>
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center"><User size={20} /></div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Mother's Details</h4>
                  </div>
                  <DetailItem label="Name" value={motherName} />
                  <DetailItem label="Phone Number" value={motherPhone} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem label="Parent Email" value={parentEmail} icon={Mail} />
                <DetailItem label="Parent Occupation" value={parentOccupation} icon={User} />
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DetailItem label="Current Class" value={className} icon={GraduationCap} />
                <DetailItem label="Section" value={sectionName} />
                <DetailItem label="Roll Number" value={rollNo} />
                <DetailItem label="Admission Date" value={admissionDate ? new Date(admissionDate).toLocaleDateString() : undefined} icon={Clock} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">Subjects & Assigned Teachers</h3>
                {teachingMap?.subjects?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {teachingMap.subjects.map((row: any) => (
                      <div key={row.subjectId || row.subjectName} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center font-bold text-blue-600 shrink-0">
                          {(row.subjectName || '?').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{row.subjectName}</div>
                          <div className="text-xs font-medium text-slate-500 truncate">
                            {row.teachers?.length ? row.teachers.map((t: any) => t.name).join(', ') : 'No teacher assigned'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No subject–teacher mapping for this section yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Attendance Record</h3>
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
                const present = attendance.filter((r) => ['PRESENT', 'LATE'].includes((r.status || '').toUpperCase())).length;
                const absent = attendance.filter((r) => (r.status || '').toUpperCase() === 'ABSENT').length;
                const leave = attendance.filter((r) => (r.status || '').toUpperCase() === 'LEAVE').length;
                const pct = total > 0 ? Math.round((present / total) * 100) : 0;

                const getPctColor = (p: number) => {
                  if (p >= 90) return 'text-emerald-600 dark:text-emerald-400';
                  if (p >= 75) return 'text-blue-600 dark:text-blue-400';
                  if (p >= 60) return 'text-amber-600 dark:text-amber-400';
                  return 'text-rose-500 dark:text-rose-400';
                };

                const statusStyle = (status?: string) => {
                  const s = (status || '').toUpperCase();
                  if (s === 'PRESENT') return 'bg-emerald-500/10 text-emerald-600';
                  if (s === 'ABSENT') return 'bg-red-500/10 text-red-500';
                  if (s === 'LATE') return 'bg-amber-400/10 text-amber-600';
                  if (s === 'LEAVE') return 'bg-amber-400/10 text-amber-600';
                  return 'bg-slate-100 text-slate-500';
                };

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                        <div className={`text-2xl sm:text-4xl font-bold tracking-tight mb-1 ${getPctColor(pct)}`}>{total > 0 ? `${pct}%` : '—'}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance %</div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-600">
                        <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">{present}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest">Present</div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-center text-red-500">
                        <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">{absent}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest">Absent</div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-amber-400/10 border border-amber-400/20 text-center text-amber-600">
                        <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">{leave}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest">Leave</div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-center text-slate-600 dark:text-slate-400">
                        <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">{total}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest">Total Classes</div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden overflow-x-auto w-full">
                      <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Day</th>
                            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remarks</th>
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
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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

          {activeTab === 'documents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DOCUMENT_NAMES.map((docName) => {
                const docUrl = documents[docName] || documents[docName.replace(/\s+/g, '_')];
                const verInfo = documentVerification[docName] || { status: 'PENDING' };
                return (
                  <div key={docName} className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">{docName}</h4>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0',
                        verInfo.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                        verInfo.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800',
                      )}>
                        {verInfo.status || 'PENDING'}
                      </span>
                    </div>
                    {docUrl ? (
                      <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                        <FileText size={14} /> View File
                      </a>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400 italic">Not Uploaded</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
