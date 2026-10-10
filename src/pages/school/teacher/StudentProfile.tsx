import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Users, GraduationCap, FileCheck, Calendar, Mail, Smartphone,
  MapPin, HeartPulse, Shield, FileText, Download, Loader2, AlertCircle, Clock, CheckCircle,
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { exportToPDF } from '@/lib/school/pdfExport';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    return (
      <div className="w-full space-y-4 px-4 sm:px-0">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-44 w-full rounded-3xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    );
  }

  if (!student || error) {
    return (
      <div className="p-4 text-center sm:p-12">
        <Card className="mx-auto max-w-md rounded-3xl border-red-100 bg-red-50 p-8 shadow-xl shadow-red-200/20">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="mb-2 text-xl font-bold tracking-tight text-red-900">Student Not Found</h2>
          <p className="mb-6 text-sm font-bold text-red-600">{error || "We couldn't find this student profile."}</p>
          <Button onClick={() => navigate(-1)} className="rounded-xl bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700">
            Go Back
          </Button>
        </Card>
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
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="h-auto gap-2 self-start p-0 text-sm font-bold text-slate-500 hover:bg-transparent hover:text-slate-900"
        >
          <ArrowLeft size={18} /> Back to Students
        </Button>
        <Button
          variant="outline"
          onClick={handleExportPDF}
          disabled={exporting}
          className="gap-1.5 rounded-xl text-sm font-bold text-slate-600"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Export PDF
        </Button>
      </div>

      <Card id="teacher-student-profile-content" className="bg-white dark:bg-slate-950 rounded-3xl sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border-slate-100 dark:border-slate-800 overflow-hidden mb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <Avatar className="size-24 shrink-0 rounded-3xl border-4 border-white/30 bg-white/10 shadow-xl backdrop-blur-md sm:size-28">
              {student.profileImage && <AvatarImage src={student.profileImage} alt={student.name} className="object-cover" />}
              <AvatarFallback className="rounded-none bg-transparent text-3xl font-black text-white">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight break-words">{student.name}</h1>
                <Badge
                  variant="outline"
                  className={cn(
                    'gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white',
                    (student.isActive ?? student.is_active) ? 'border-emerald-400 bg-emerald-500/90' : 'border-slate-600 bg-slate-800/90 text-slate-200',
                  )}
                >
                  {(student.isActive ?? student.is_active) ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-blue-100">
                <Badge variant="outline" className="bg-white/15 px-2.5 py-1 rounded-xl backdrop-blur-sm border-white/10 text-blue-100">
                  {className ? `${className.toLowerCase().startsWith('class') ? className : `Class ${className}`} / ${sectionName || '—'}` : '—'}
                </Badge>
                {student.email && <Badge variant="outline" className="bg-white/15 px-2.5 py-1 rounded-xl backdrop-blur-sm border-white/10 text-blue-100 truncate max-w-[220px]">{student.email}</Badge>}
              </div>
            </div>
            {enrollmentNo && (
              <Card className="text-center sm:text-right shrink-0 bg-white/10 p-3 rounded-2xl backdrop-blur-sm border-white/10 text-white shadow-none">
                <div className="text-[9px] font-bold tracking-widest text-blue-200 uppercase mb-0.5">Enrollment No</div>
                <div className="text-base font-black tracking-tight">{enrollmentNo}</div>
              </Card>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-10 pt-6 pb-10 sm:pb-14">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as (typeof TABS)[number]['id'])} className="mb-6">
            <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-b border-slate-100 bg-transparent p-0 pb-4 dark:border-slate-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map(({ id: tabId, label, icon: Icon }) => (
                <TabsTrigger
                  key={tabId}
                  value={tabId}
                  className="shrink-0 gap-1.5 whitespace-nowrap rounded-2xl border border-transparent px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 data-[state=active]:border-blue-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 dark:hover:bg-slate-900/70 dark:hover:text-white"
                >
                  <Icon size={16} /> {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

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
                <Card className="rounded-3xl border-0 bg-blue-600 p-6 text-white shadow-xl shadow-blue-600/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-80">Medical Alert</h4>
                    <AlertCircle size={20} />
                  </div>
                  <p className="text-sm font-bold leading-relaxed mb-4">
                    {medicalConditions || 'No significant medical conditions reported.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-lg border-transparent bg-white/20 px-2 py-1 text-[10px] font-bold uppercase text-white">Blood: {bloodGroup || '—'}</Badge>
                    <Badge variant="outline" className="rounded-lg border-transparent bg-white/20 px-2 py-1 text-[10px] font-bold uppercase text-white">Allergy: {allergies || 'None'}</Badge>
                  </div>
                </Card>
                <Card className="p-6 rounded-3xl bg-blue-50/60 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 shadow-none">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} /> Enrollment Status
                  </h4>
                  <p className="text-sm font-extrabold text-blue-950 dark:text-blue-100">
                    {profile.status || ((student.isActive ?? student.is_active) ? 'ACTIVE' : 'INACTIVE')}
                  </p>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'family' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Family & Guardian Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 space-y-4 shadow-none">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><User size={20} /></div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Father's Details</h4>
                  </div>
                  <DetailItem label="Name" value={fatherName} />
                  <DetailItem label="Phone Number" value={fatherPhone || parentPhone} />
                </Card>
                <Card className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 space-y-4 shadow-none">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center"><User size={20} /></div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Mother's Details</h4>
                  </div>
                  <DetailItem label="Name" value={motherName} />
                  <DetailItem label="Phone Number" value={motherPhone} />
                </Card>
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
                        <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center font-bold text-blue-600 shrink-0">
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
                  <Label htmlFor="attendance-month" className="text-xs font-bold uppercase text-slate-400">Month</Label>
                  <Input
                    id="attendance-month"
                    type="month"
                    value={attendanceMonth}
                    onChange={(e) => setAttendanceMonth(e.target.value)}
                    className="h-10 w-auto rounded-xl border-2 border-slate-100 bg-white text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
                      <Card className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-center shadow-none">
                        <div className={`text-2xl sm:text-4xl font-bold tracking-tight mb-1 ${getPctColor(pct)}`}>{total > 0 ? `${pct}%` : '—'}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance %</div>
                      </Card>
                      <Card className="p-6 rounded-[2rem] bg-emerald-500/10 border-emerald-500/20 text-center text-emerald-600 shadow-none">
                        <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">{present}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest">Present</div>
                      </Card>
                      <Card className="p-6 rounded-[2rem] bg-red-500/10 border-red-500/20 text-center text-red-500 shadow-none">
                        <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">{absent}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest">Absent</div>
                      </Card>
                      <Card className="p-6 rounded-[2rem] bg-amber-400/10 border-amber-400/20 text-center text-amber-600 shadow-none">
                        <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">{leave}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest">Leave</div>
                      </Card>
                      <Card className="p-6 rounded-[2rem] bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-center text-slate-600 dark:text-slate-400 shadow-none">
                        <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">{total}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest">Total Classes</div>
                      </Card>
                    </div>

                    {(() => {
                      const sorted = [...attendance].sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
                      if (sorted.length === 0) {
                        return (
                          <Card className="rounded-3xl border-slate-100 p-10 text-center font-bold text-slate-400 shadow-none dark:border-slate-800">
                            No attendance records for this month.
                          </Card>
                        );
                      }
                      return (
                        <>
                          {/* Phones: one card per day */}
                          <div className="space-y-2 md:hidden">
                            {sorted.map((record, i) => {
                              const d = new Date(record.date);
                              return (
                                <Card key={record.id || i} className="flex items-center justify-between gap-3 rounded-2xl border-slate-100 p-4 shadow-none dark:border-slate-800">
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                      {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      <span className="ml-2 text-xs font-bold text-slate-400">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                                    </p>
                                    {record.remarks && <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">{record.remarks}</p>}
                                  </div>
                                  <Badge variant="outline" className={`shrink-0 rounded-lg border-transparent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyle(record.status)}`}>
                                    {record.status || 'Unknown'}
                                  </Badge>
                                </Card>
                              );
                            })}
                          </div>

                          {/* Tablet / desktop table */}
                          <div className="hidden w-full overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 md:block">
                            <Table>
                              <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
                                <TableRow>
                                  <TableHead className="p-4 text-[10px] font-bold uppercase tracking-widest">Date</TableHead>
                                  <TableHead className="p-4 text-[10px] font-bold uppercase tracking-widest">Day</TableHead>
                                  <TableHead className="p-4 text-[10px] font-bold uppercase tracking-widest">Status</TableHead>
                                  <TableHead className="p-4 text-[10px] font-bold uppercase tracking-widest">Remarks</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody className="text-sm">
                                {sorted.map((record, i) => {
                                  const d = new Date(record.date);
                                  return (
                                    <TableRow key={record.id || i}>
                                      <TableCell className="p-4 font-bold text-slate-700 dark:text-slate-200">
                                        {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </TableCell>
                                      <TableCell className="p-4 font-bold text-slate-400">
                                        {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                                      </TableCell>
                                      <TableCell className="p-4">
                                        <Badge variant="outline" className={`rounded-lg border-transparent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyle(record.status)}`}>
                                          {record.status || 'Unknown'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="p-4 font-bold text-slate-400">{record.remarks || '—'}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      );
                    })()}
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
                  <Card key={docName} className="p-5 rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">{docName}</h4>
                      <Badge
                        variant="outline"
                        className={cn(
                          'shrink-0 rounded-full border-transparent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          verInfo.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                          verInfo.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800',
                        )}
                      >
                        {verInfo.status || 'PENDING'}
                      </Badge>
                    </div>
                    {docUrl ? (
                      <Button asChild variant="link" className="h-auto gap-1 p-0 text-xs font-bold text-blue-600">
                        <a href={docUrl} target="_blank" rel="noopener noreferrer">
                          <FileText size={14} /> View File
                        </a>
                      </Button>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400 italic">Not Uploaded</p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StudentProfile;
