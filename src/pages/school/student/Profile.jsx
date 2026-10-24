import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/SchoolAuthContext';
import {
  BookOpen, GraduationCap, KeyRound, ShieldCheck, UserCircle, Users,
  BarChart2, Calendar, Shield, Mail, Smartphone, MapPin, User, AlertCircle,
  TrendingUp, Target, Flame, IdCard, Download, Loader2, UserCheck,
  ChevronRight, Building2, Hash, Sparkles,
} from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import schoolApi from '@/lib/api/school-client';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Document, Page, pdfjs } from 'react-pdf';
import { CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Accent colours, written out in full so Tailwind can see every class.
const TONES = {
  blue: { chip: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400', grad: 'from-blue-500 to-cyan-500', glow: 'bg-blue-500/15' },
  emerald: { chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400', grad: 'from-emerald-500 to-teal-500', glow: 'bg-emerald-500/15' },
  violet: { chip: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400', grad: 'from-violet-500 to-fuchsia-500', glow: 'bg-violet-500/15' },
  indigo: { chip: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400', grad: 'from-indigo-500 to-violet-500', glow: 'bg-indigo-500/15' },
  amber: { chip: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400', grad: 'from-amber-500 to-orange-500', glow: 'bg-amber-500/15' },
  rose: { chip: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400', grad: 'from-rose-500 to-pink-500', glow: 'bg-rose-500/15' },
  cyan: { chip: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400', grad: 'from-cyan-500 to-sky-500', glow: 'bg-cyan-500/15' },
};

// Subject pills cycle through these so a row of subjects reads as a colourful set.
const SUBJECT_PILLS = [
  'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50',
  'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
  'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/50',
  'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
  'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50',
  'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900/50',
];

const CARD = 'rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-950 dark:shadow-none';

function ProfileField({ label, value, icon: Icon, tone = 'blue', onRequestEdit }) {
  const t = TONES[tone] || TONES.blue;
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 sm:p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/30 dark:hover:border-slate-700 dark:hover:bg-slate-900">
      <span className={`flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl ${t.chip}`}>
        {Icon && <Icon className="size-4 sm:size-[18px]" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
        {value ? (
          <p className="mt-0.5 truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white" title={String(value)}>{value}</p>
        ) : (
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium italic text-slate-400 dark:text-slate-500">Not specified</span>
            <button
              onClick={onRequestEdit}
              className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              + Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// One of the four summary cards under the hero: gradient icon chip, big value, optional progress bar.
function StatCard({ icon: Icon, label, tone, children, helper, progress }) {
  const t = TONES[tone];
  return (
    <div className={`${CARD} group relative overflow-hidden p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
      <span aria-hidden className={`pointer-events-none absolute -right-8 -top-8 size-28 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125 ${t.glow}`} />
      <div className="relative flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span className={`flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${t.grad}`}>
          <Icon className="size-5" />
        </span>
        <p className="max-w-full truncate text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
      </div>
      <div className="relative mt-3 sm:mt-4">{children}</div>
      {progress != null && (
        <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${t.grad}`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
      {helper && <p className="relative mt-2 text-[11px] sm:text-xs font-semibold leading-snug text-slate-400 dark:text-slate-500">{helper}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, tone, title, subtitle }) {
  const t = TONES[tone];
  return (
    <div className="flex items-center gap-3">
      <span className={`flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${t.grad}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <h2 className="!text-sm !leading-5 sm:!text-base sm:!leading-6 font-extrabold text-slate-950 dark:text-white">{title}</h2>
        <p className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, institute } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // The class teacher of the student's own section, looked up from the section's teaching map.
  const [sectionTeacher, setSectionTeacher] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [idCardLoading, setIdCardLoading] = useState(false);
  const [idCardUrl, setIdCardUrl] = useState(null);
  const [idCardNumPages, setIdCardNumPages] = useState(0);
  // 'loading' | 'ready' | 'not-issued' | 'error' — drives which of the three
  // states (spinner / card / "not issued yet" message) the section shows.
  const [idCardStatus, setIdCardStatus] = useState('loading');

  // Revoke the blob URL when it's replaced or the page unmounts, so it
  // doesn't leak memory across repeated "view" clicks.
  useEffect(() => {
    return () => {
      if (idCardUrl) URL.revokeObjectURL(idCardUrl);
    };
  }, [idCardUrl]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRequestEdit = () => {
    toast.info("Please contact the school administration to update your profile details.");
  };

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await schoolApi.get('/students/profile/me');
        const data = res.data?.data ?? res.data;
        setStudentData(data);
      } catch (err) {
        console.error('Error fetching student profile:', err);
        toast.error('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Who is the class teacher of this student's class/section? Ask the section's teaching
  // map for it, then borrow the teacher's photo from the student's timetable if the map
  // doesn't carry one. Optional: when it fails the profile just shows no class teacher.
  useEffect(() => {
    if (loading) return undefined;
    const sp = studentData?.studentProfile || {};
    const sectionId = sp.sectionId || sp.section?.id || user?.studentProfile?.sectionId || user?.sectionId;
    if (!sectionId) return undefined;

    let cancelled = false;
    const sameName = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

    (async () => {
      try {
        const res = await schoolApi.get(`/academic/sections/${sectionId}/teaching-map`);
        const map = res.data?.data ?? res.data ?? {};

        let teacher = map.classTeacher && typeof map.classTeacher === 'object' ? { ...map.classTeacher } : null;
        if (!teacher?.name) {
          // Fall back to the assignment flagged as class teacher.
          const flagged = (map.rawAssignments || []).find((a) => a.isClassTeacher);
          if (flagged) {
            const listed = (map.subjects || []).flatMap((row) => row.teachers || []).find((t) => t.userId === flagged.teacherUserId);
            teacher = { name: flagged.teacherName || listed?.name, email: flagged.teacherEmail };
          }
        }
        if (!teacher?.name) return;

        let photo = teacher.profileImage || teacher.profilePictureUrl || teacher.photo || teacher.avatar || teacher.teacherImage || teacher.image || null;
        if (!photo) {
          try {
            const tt = await schoolApi.get('/timetables/student/me');
            const classes = tt.data?.timetable || tt.data?.data?.timetable || [];
            photo = classes.find((c) => c.teacherImage && sameName(c.teacher, teacher.name))?.teacherImage || null;
          } catch {
            /* photo is optional */
          }
        }

        if (!cancelled) {
          setSectionTeacher({ name: teacher.name, photo });
        }
      } catch (err) {
        console.error('Could not load the class teacher for this section:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [loading, studentData, user?.studentProfile?.sectionId, user?.sectionId]);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await schoolApi.get('/reports/my-analytics');
        setAnalytics(res.data?.data ?? res.data);
      } catch (err) {
        console.error('Error fetching performance analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const loadIdCard = async (announce = false) => {
    setIdCardLoading(true);
    try {
      const res = await schoolApi.get('/institute-admin/document/my-id-card');
      // The global ResponseInterceptor wraps every controller return in
      // {success, data, ...} — the admin document generator page already
      // handles this defensively; this call needs the same fallback.
      const pdfBase64 = res.data?.data?.pdfBase64 ?? res.data?.pdfBase64;
      if (!pdfBase64) throw new Error('No ID card data returned');
      const bytes = Uint8Array.from(window.atob(pdfBase64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      setIdCardNumPages(0);
      setIdCardUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setIdCardStatus('ready');
    } catch (err) {
      console.error('Error loading ID card:', err);
      // A 404 just means the school hasn't issued one yet — that's an
      // expected, silent state on first load, not something to toast about.
      if (err?.response?.status === 404) {
        setIdCardStatus('not-issued');
      } else {
        setIdCardStatus('error');
        if (announce) toast.error(err?.response?.data?.message || 'Failed to load your ID card.');
      }
    } finally {
      setIdCardLoading(false);
    }
  };

  // Auto-load on page open — a student with a card already issued should
  // just see it, not have to click a button to find out one exists.
  useEffect(() => {
    loadIdCard(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-1">
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="h-32 sm:h-40 bg-slate-200 dark:bg-slate-800" />
          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-12 size-24 sm:size-28 rounded-3xl bg-slate-300 ring-4 ring-white dark:bg-slate-700 dark:ring-slate-950" />
            <div className="mt-4 h-6 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="mt-2 h-4 w-72 max-w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-36 rounded-3xl bg-slate-200 dark:bg-slate-800" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-80 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  const student = studentData || {};
  // Prefer the fresh per-page fetch over the auth context's cached copy — the
  // latter is only refreshed once per full page load/login, so a photo an
  // admin just set stays invisible here until the student's browser tab
  // happens to reload, even though this page's own fetch already has it.
  const profileImage = student.profileImage || user?.profileImage || null;
  const profile = student.studentProfile || {};
  const parents = student.parentDetails || {};

  const className = profile.section?.class?.name || profile.className || user?.studentProfile?.className || '';
  const sectionName = profile.section?.name || profile.sectionName || user?.studentProfile?.sectionName || '';
  // The API usually sends the name already prefixed ("Class 10"), so only add the word when it is a bare
  // number ("10"). Names like "LKG" or "Nursery" are shown exactly as they are.
  const classLabel = /^\s*\d/.test(className) ? `Class ${String(className).trim()}` : String(className).trim();
  const classWithSection = classLabel ? `${classLabel}${sectionName ? ` · ${sectionName}` : ''}` : '';
  const rollNo = profile.rollNo || profile.roll_no || user?.studentProfile?.rollNo || '';
  const enrollmentNo = profile.enrollmentNo || user?.studentProfile?.enrollmentNo || '';

  // Performance calculations
  const completedSessions = student.performance || [];
  const totalSessions = completedSessions.length;
  const avgAccuracy = totalSessions > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (parseFloat(s.accuracy) || 0), 0) / totalSessions)
    : null;

  // Subjects lists
  const subjectsList = profile.subjects || [];
  const maxVisibleSubjects = 3;
  const visibleSubjects = subjectsList.slice(0, maxVisibleSubjects);
  const overflowCount = subjectsList.length - maxVisibleSubjects;

  // Class teacher of the student's section. The profile API may send it as a name
  // string or an object, on the profile, the section or the student, so look in each.
  const firstFilled = (...values) => values.find((v) => v !== undefined && v !== null && String(v).trim() !== '');
  const rawClassTeacher = firstFilled(
    student.classTeacher, profile.classTeacher, profile.section?.classTeacher, student.section?.classTeacher,
    profile.class_teacher, profile.section?.class_teacher,
  );
  const classTeacherObj = rawClassTeacher && typeof rawClassTeacher === 'object' ? rawClassTeacher : {};
  const profileTeacherName = firstFilled(
    typeof rawClassTeacher === 'string' ? rawClassTeacher : undefined,
    classTeacherObj.name, classTeacherObj.user?.name,
    [classTeacherObj.firstName, classTeacherObj.lastName].filter(Boolean).join(' '),
    student.classTeacherName, profile.classTeacherName, profile.section?.classTeacherName,
    profile.class_teacher_name, profile.section?.class_teacher_name,
  ) || '';
  const profileTeacherPhoto = firstFilled(
    classTeacherObj.profileImage, classTeacherObj.user?.profileImage, classTeacherObj.profilePictureUrl,
    classTeacherObj.photo, classTeacherObj.avatar, classTeacherObj.teacherImage, classTeacherObj.image,
    student.classTeacherImage, profile.classTeacherImage, profile.section?.classTeacherImage,
    student.classTeacherPhoto, profile.classTeacherPhoto,
  ) || null;

  const classTeacherName = sectionTeacher?.name || profileTeacherName;
  const classTeacherPhoto = sectionTeacher?.photo || profileTeacherPhoto;

  const hasParentDetails = !!(parents.fatherName || parents.motherName || parents.guardianName || parents.email || parents.parentPhone);

  const parentName = parents.fatherName || parents.motherName || parents.guardianName || '';
  const parentContact = parents.parentPhone || parents.fatherPhone || parents.motherPhone || parents.guardianPhone || '';
  const parentEmail = parents.email || parents.parentEmail || '';
  const parentRelation = parents.primaryContact 
    ? parents.primaryContact.charAt(0).toUpperCase() + parents.primaryContact.slice(1)
    : '';

  const dobText = profile.dob
    ? new Date(profile.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '';
  const attendancePct = student.attendancePercentage;
  const hasAttendance = attendancePct !== null && attendancePct !== undefined;

  return (
    <div className="space-y-6 pb-12 p-1">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className={`${CARD} overflow-hidden`}>
        <div className="relative h-32 sm:h-40 overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.22)_1px,transparent_0)] bg-[size:20px_20px]" />
          <div aria-hidden className="absolute -left-10 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="absolute -bottom-20 right-10 size-64 rounded-full bg-fuchsia-400/30 blur-3xl" />
          <div aria-hidden className="absolute right-1/3 -top-10 size-40 rounded-full bg-cyan-300/20 blur-3xl" />
          <span className="absolute right-4 top-4 sm:right-6 sm:top-5 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-white backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Active
          </span>
        </div>

        <div className="relative px-5 pb-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <ProfileAvatar
              src={profileImage}
              name={user?.name}
              className="-mt-14 sm:-mt-16 size-28 sm:size-32 shrink-0 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 ring-4 ring-white shadow-2xl shadow-indigo-500/20 dark:ring-slate-950"
              fallbackClassName="text-3xl sm:text-4xl font-black text-indigo-700 dark:text-indigo-300"
            />
            <div className="min-w-0 flex-1 sm:pb-1">
              <h1 className="truncate !text-2xl !leading-8 sm:!text-3xl sm:!leading-9 font-extrabold tracking-tight text-slate-950 dark:text-white">{user?.name || 'Student'}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                <Building2 className="size-3.5 sm:size-4 text-slate-400" />
                {institute?.name || 'EDDVA School Portal'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {className && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                <GraduationCap className="size-3.5" />
                {classWithSection}
              </span>
            )}
            {rollNo && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300">
                <Hash className="size-3.5" />
                Roll {rollNo}
              </span>
            )}
            {enrollmentNo && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[11px] sm:text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <Sparkles className="size-3.5 text-amber-500" />
                {enrollmentNo}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="Attendance"
          tone="blue"
          progress={hasAttendance ? Number(attendancePct) : 0}
          helper={hasAttendance ? 'Overall attendance presence' : 'No attendance record found'}
        >
          <div className="flex items-baseline gap-2">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {hasAttendance ? `${attendancePct}%` : '—'}
            </p>
            {!hasAttendance && (
              <button onClick={handleRequestEdit} className="text-[10px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">+ Add</button>
            )}
          </div>
        </StatCard>

        <StatCard
          icon={BarChart2}
          label="Avg Accuracy"
          tone="emerald"
          progress={avgAccuracy !== null ? avgAccuracy : 0}
          helper={avgAccuracy !== null ? `Based on ${totalSessions} evaluated assessments` : 'No test sessions completed yet'}
        >
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            {avgAccuracy !== null ? `${avgAccuracy}%` : '—'}
          </p>
        </StatCard>

        <div className="col-span-2 lg:col-span-1 [&>div]:h-full">
        <StatCard icon={GraduationCap} label="Acad Year" tone="indigo" helper="Current calendar year">
          <div className="flex items-baseline gap-2">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">{profile.academicYear || '—'}</p>
            {!profile.academicYear && (
              <button onClick={handleRequestEdit} className="text-[10px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">+ Add</button>
            )}
          </div>
        </StatCard>
        </div>

        <div className="col-span-2 lg:col-span-1 [&>div]:h-full">
          <StatCard
            icon={UserCheck}
            label="Class Teacher"
            tone="violet"
            helper={classTeacherName ? (classWithSection || 'Your class teacher') : 'No class teacher assigned yet'}
          >
            {classTeacherName ? (
              <div className="flex items-center gap-3 min-w-0">
                <ProfileAvatar
                  src={classTeacherPhoto}
                  name={classTeacherName}
                  className="size-12 sm:size-14 shrink-0 rounded-2xl bg-violet-50 ring-2 ring-violet-100 shadow-md shadow-violet-500/10 dark:ring-violet-900/50"
                  fallbackClassName="text-lg sm:text-xl font-black text-violet-700 dark:text-violet-300"
                />
                <p className="min-w-0 truncate text-base sm:text-lg font-extrabold tracking-tight text-slate-950 dark:text-white" title={classTeacherName}>
                  {classTeacherName}
                </p>
              </div>
            ) : (
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">—</p>
            )}
          </StatCard>
        </div>
      </div>

      {/* ── Details ──────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal & Academic Details */}
        <section className={`${CARD} space-y-5 p-4 sm:p-6`}>
          <SectionHeader icon={UserCircle} tone="blue" title="Personal & Identity Details" subtitle="Essential identity and enrollment values." />

          <div className="grid gap-3 sm:grid-cols-2">
            <ProfileField label="Full Name" value={user?.name} icon={User} tone="blue" onRequestEdit={handleRequestEdit} />
            <ProfileField label="Student ID / User ID" value={user?.id} icon={Shield} tone="indigo" onRequestEdit={handleRequestEdit} />
            <ProfileField label="Roll Number" value={rollNo} icon={Hash} tone="violet" onRequestEdit={handleRequestEdit} />
            <ProfileField label="National ID" value={profile.nationalId} icon={ShieldCheck} tone="emerald" onRequestEdit={handleRequestEdit} />
            <ProfileField label="Primary Contact Phone" value={user?.phone} icon={Smartphone} tone="cyan" onRequestEdit={handleRequestEdit} />
            <ProfileField label="Date of Birth" value={dobText} icon={Calendar} tone="amber" onRequestEdit={handleRequestEdit} />
          </div>

          {/* Subjects */}
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/80 to-white p-4 sm:p-5 dark:border-slate-800 dark:from-slate-900/40 dark:to-slate-950">
            <h3 className="mb-3 flex items-center gap-2 !text-[10px] !leading-4 sm:!text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <BookOpen className="size-3.5" />
              </span>
              Academic Curriculum Subjects
              {subjectsList.length > 0 && (
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{subjectsList.length}</span>
              )}
            </h3>
            {subjectsList.length === 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold italic text-slate-400 dark:text-slate-500">No subjects assigned yet</span>
                <button onClick={handleRequestEdit} className="text-[10px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">+ Add</button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {(showAllSubjects ? subjectsList : visibleSubjects).map((sub, idx) => (
                  <span
                    key={idx}
                    className={`rounded-xl border px-3 py-1.5 text-[11px] sm:text-xs font-bold shadow-sm ${SUBJECT_PILLS[idx % SUBJECT_PILLS.length]}`}
                  >
                    {sub}
                  </span>
                ))}
                {!showAllSubjects && overflowCount > 0 && (
                  <button
                    onClick={() => setShowAllSubjects(true)}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] sm:text-xs font-extrabold text-slate-600 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    +{overflowCount} more
                  </button>
                )}
                {showAllSubjects && subjectsList.length > maxVisibleSubjects && (
                  <button
                    onClick={() => setShowAllSubjects(false)}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] sm:text-xs font-extrabold text-slate-600 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Show Less
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Parent / Guardian + Security */}
        <section className={`${CARD} flex flex-col justify-between p-4 sm:p-6`}>
          <div className="space-y-5">
            <SectionHeader icon={Users} tone="violet" title="Parent & Guardian Information" subtitle="Contact mapping for emergency logs." />

            {!hasParentDetails ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-6 sm:p-8 text-center dark:border-slate-800 dark:bg-slate-900/20">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500 dark:bg-violet-950/40">
                  <Users className="size-7" />
                </span>
                <h3 className="mt-3 !text-xs !leading-4 sm:!text-sm sm:!leading-5 font-bold text-slate-950 dark:text-white">No Guardian Details Found</h3>
                <p className="mt-1.5 max-w-xs text-[10px] sm:text-xs leading-normal text-slate-500 dark:text-slate-500">
                  Family contact details and emergency parent records are currently missing from the portal.
                </p>
                <button
                  onClick={handleRequestEdit}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-[10px] sm:text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  Request to Add Details
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileField label="Parent / Guardian Name" value={parentName} icon={User} tone="violet" onRequestEdit={handleRequestEdit} />
                <ProfileField label="Contact Details" value={parentContact} icon={Smartphone} tone="emerald" onRequestEdit={handleRequestEdit} />
                <ProfileField label="Email Address" value={parentEmail} icon={Mail} tone="rose" onRequestEdit={handleRequestEdit} />
                <ProfileField label="Relationship" value={parentRelation} icon={Users} tone="amber" onRequestEdit={handleRequestEdit} />
              </div>
            )}
          </div>

          {/* Security */}
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800/80">
            <h3 className="flex items-center gap-2 !text-[10px] !leading-4 sm:!text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <ShieldCheck className="size-4 text-emerald-500" />
              Security Settings
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  toast.success("A password reset link has been sent to your registered email.");
                }}
                className="group flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/30 dark:hover:border-blue-900 dark:hover:bg-slate-900"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <KeyRound className="size-5" />
                </span>
                <span className="flex-1 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Change Password</span>
                <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 transition-colors group-hover:text-blue-600 dark:text-slate-500">
                  Send Link <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>

              <button
                onClick={() => {
                  toast.info("Your account is currently active on 1 device session.");
                }}
                className="group flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/30 dark:hover:border-emerald-900 dark:hover:bg-slate-900"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <Smartphone className="size-5" />
                </span>
                <span className="flex-1 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Review Device Sessions</span>
                <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 transition-colors group-hover:text-emerald-600 dark:text-slate-500">
                  Review <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Performance Matrix & ID Card */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Matrix */}
        <section className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 shadow-xl shadow-slate-100/50 dark:border-slate-800/80 dark:bg-slate-950 dark:shadow-none space-y-5 sm:space-y-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <TrendingUp className="size-5 sm:size-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white">Performance Matrix</h2>
              <p className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500">Accuracy across subjects, from your published results.</p>
            </div>
          </div>

          {analyticsLoading ? (
            <div className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
          ) : !analytics || !analytics.questionsAttempted ? (
            <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
              <BarChart2 className="size-8 sm:size-10 text-slate-400 mb-2.5 sm:mb-3" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">No Results Yet</h3>
              <p className="mt-1.5 text-[10px] sm:text-xs text-slate-450 dark:text-slate-500 max-w-xs leading-normal">Your performance matrix will appear once assessment results are published.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <Target className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="mt-1.5 text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300">{Math.round(analytics.overallAccuracy)}%</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Accuracy</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3 text-center dark:border-blue-900/40 dark:bg-blue-950/20">
                  <BarChart2 className="mx-auto size-4 text-blue-600 dark:text-blue-400" />
                  <p className="mt-1.5 text-lg sm:text-xl font-black text-blue-700 dark:text-blue-300">{analytics.questionsAttempted}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Attempted</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
                  <Flame className="mx-auto size-4 text-amber-600 dark:text-amber-400" />
                  <p className="mt-1.5 text-lg sm:text-xl font-black text-amber-700 dark:text-amber-300">{analytics.streakDays}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Day Streak</p>
                </div>
              </div>

              {analytics.subjectPerformance?.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-[10px] sm:text-xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Subject-wise Accuracy</h3>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analytics.subjectPerformance}
                        margin={{ top: 36, right: 20, left: 4, bottom: 40 }}
                      >
                        <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="subjectName"
                          interval={0}
                          angle={-35}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: 10, fill: '#334155', fontWeight: 800 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          width={34}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={(v) => `${v}%`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold shadow-lg dark:border-slate-700 dark:bg-slate-900">
                                <p className="text-slate-900 dark:text-white">{d.subjectName}</p>
                                <p className="text-slate-500 dark:text-slate-400">
                                  {Math.round(d.accuracy)}% accuracy · {d.attempts} attempt{d.attempts === 1 ? '' : 's'}
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="accuracy"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={({ cx, cy, payload }) => (
                            <circle
                              key={`dot-${payload.subjectName}`}
                              cx={cx}
                              cy={cy}
                              r={4}
                              fill={payload.accuracy >= 75 ? '#10b981' : payload.accuracy >= 60 ? '#f59e0b' : '#f43f5e'}
                              stroke="#fff"
                              strokeWidth={1.5}
                            />
                          )}
                          activeDot={{ r: 6 }}
                        >
                          <LabelList
                            dataKey="accuracy"
                            position="top"
                            offset={10}
                            formatter={(v) => `${Math.round(v)}%`}
                            style={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                          />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Color-coded legend — same green/amber/red thresholds as the line's dots, broken out per subject. */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {analytics.subjectPerformance.map((subj) => {
                      const tone = subj.accuracy >= 75 ? 'emerald' : subj.accuracy >= 60 ? 'amber' : 'rose';
                      return (
                        <div
                          key={subj.subjectName}
                          className={cn(
                            'flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2',
                            tone === 'emerald' && 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20',
                            tone === 'amber' && 'border-amber-100 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20',
                            tone === 'rose' && 'border-rose-100 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20',
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span
                              className={cn(
                                'size-2 shrink-0 rounded-full',
                                tone === 'emerald' && 'bg-emerald-500',
                                tone === 'amber' && 'bg-amber-500',
                                tone === 'rose' && 'bg-rose-500',
                              )}
                            />
                            <span className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-300">{subj.subjectName}</span>
                          </div>
                          <span
                            className={cn(
                              'shrink-0 text-xs font-black',
                              tone === 'emerald' && 'text-emerald-700 dark:text-emerald-300',
                              tone === 'amber' && 'text-amber-700 dark:text-amber-300',
                              tone === 'rose' && 'text-rose-700 dark:text-rose-300',
                            )}
                          >
                            {Math.round(subj.accuracy)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {analytics.weakTopics?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Needs focus:</span>
                  {analytics.weakTopics.map((t) => (
                    <span key={t.subjectName} className="rounded-lg bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                      {t.subjectName}
                    </span>
                  ))}
                </div>
              )}

              {analytics.insights?.summary && (
                <div className="flex items-start gap-2 rounded-2xl border border-slate-100 bg-slate-50/30 p-3 dark:border-slate-800 dark:bg-slate-900/10">
                  <Sparkles className="size-3.5 shrink-0 text-blue-500 mt-0.5" />
                  <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">{analytics.insights.summary}</p>
                </div>
              )}
            </>
          )}
        </section>

        {/* ID Card */}
        <section className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 shadow-xl shadow-slate-100/50 dark:border-slate-800/80 dark:bg-slate-950 dark:shadow-none flex flex-col">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <IdCard className="size-5 sm:size-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white">Student ID Card</h2>
              <p className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500">View or download your official school ID card.</p>
            </div>
          </div>

          {idCardStatus === 'ready' && idCardUrl ? (
            <div className="flex-1 flex flex-col my-3 sm:my-4">
              <div className="flex-1 min-h-[460px] flex items-center justify-center p-4 sm:p-6">
                <Document
                  file={idCardUrl}
                  onLoadSuccess={({ numPages }) => setIdCardNumPages(numPages)}
                  loading={<Loader2 className="size-6 animate-spin text-indigo-500" />}
                  error={<p className="text-xs font-semibold text-rose-500">Couldn't render the card preview.</p>}
                  className="flex flex-wrap items-start justify-center gap-4 sm:gap-6"
                >
                  {/* Only front/back matter here — a template with extra pages
                      (e.g. a "terms" or "emergency contact" insert) still only
                      shows the card itself, not every page of the PDF. */}
                  {Array.from({ length: Math.min(idCardNumPages, 2) }, (_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <Page pageNumber={i + 1} width={320} renderTextLayer={false} renderAnnotationLayer={false} />
                      {idCardNumPages > 1 && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{i === 0 ? 'Front' : 'Back'}</span>
                      )}
                    </div>
                  ))}
                </Document>
              </div>
            </div>
          ) : idCardStatus === 'loading' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 my-3 sm:my-4">
              <Loader2 className="size-8 animate-spin text-indigo-400" />
              <p className="mt-3 text-[10px] sm:text-xs font-semibold text-slate-400">Checking for your ID card...</p>
            </div>
          ) : idCardStatus === 'not-issued' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 my-3 sm:my-4">
              <IdCard className="size-8 sm:size-10 text-slate-400 mb-2.5 sm:mb-3" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">Not Issued Yet</h3>
              <p className="mt-1.5 text-[10px] sm:text-xs text-slate-450 dark:text-slate-500 max-w-xs leading-normal">
                Your school hasn't issued your ID card yet. Check back later, or contact the school office.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 my-3 sm:my-4">
              <AlertCircle className="size-8 sm:size-10 text-rose-400 mb-2.5 sm:mb-3" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">Couldn't Load ID Card</h3>
              <button
                onClick={() => loadIdCard(true)}
                disabled={idCardLoading}
                className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] sm:text-xs font-bold transition-all shadow-md shadow-indigo-500/10 hover:scale-102 active:scale-98 disabled:opacity-60"
              >
                {idCardLoading ? <Loader2 className="size-3.5 animate-spin" /> : <IdCard className="size-3.5" />}
                Try Again
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
