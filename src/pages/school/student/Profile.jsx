import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/SchoolAuthContext';
import {
  BookOpen, GraduationCap, KeyRound, ShieldCheck, UserCircle, Users,
  BarChart2, Calendar, Shield, Mail, Smartphone, MapPin, User, AlertCircle,
  TrendingUp, Target, Flame, IdCard, Loader2, Sparkles
} from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import schoolApi from '@/lib/api/school-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Document, Page, pdfjs } from 'react-pdf';
import { CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function ProfileField({ label, value, icon: Icon, onRequestEdit }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900/10 flex flex-col justify-between min-h-[75px] sm:min-h-[90px] hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
      <div>
        <p className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {Icon && <Icon className="size-3 sm:size-3.5 text-slate-400 shrink-0" />}
          {label}
        </p>
        <p className="mt-1 truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          {value || <span className="text-slate-400 dark:text-slate-500 italic font-medium">Not specified</span>}
        </p>
      </div>
      {!value && (
        <button 
          onClick={onRequestEdit}
          className="mt-1.5 self-start text-[9px] sm:text-[10px] font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 uppercase tracking-wider transition-colors"
        >
          + Add
        </button>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, institute } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
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

  const hasParentDetails = !!(parents.fatherName || parents.motherName || parents.guardianName || parents.email || parents.parentPhone);

  const parentName = parents.fatherName || parents.motherName || parents.guardianName || '';
  const parentContact = parents.parentPhone || parents.fatherPhone || parents.motherPhone || parents.guardianPhone || '';
  const parentEmail = parents.email || parents.parentEmail || '';
  const parentRelation = parents.primaryContact 
    ? parents.primaryContact.charAt(0).toUpperCase() + parents.primaryContact.slice(1)
    : '';

  return (
    <div className="space-y-6 pb-12 p-1">
      {/* Compressed Header Card */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 shadow-xl shadow-slate-100/50 dark:border-slate-800/80 dark:bg-slate-950 dark:shadow-none">
        <div className="absolute top-0 right-0 size-40 bg-gradient-to-br from-blue-500/10 to-indigo-500/0 blur-2xl rounded-full" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {profileImage ? (
              <ProfileAvatar
                src={profileImage}
                name={user?.name}
                className="size-16 sm:size-20 shrink-0 rounded-2xl border border-slate-200/50 shadow-md shadow-blue-500/5"
                fallbackClassName="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300"
              />
            ) : (
              <ProfileAvatar
                name={user?.name}
                className="size-16 sm:size-20 shrink-0 rounded-2xl border border-slate-200/50 bg-blue-50/50 shadow-md shadow-blue-500/5"
                fallbackClassName="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300"
              />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">{user?.name || 'Student'}</h1>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                {className && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="size-3.5 sm:size-4 text-blue-500" />
                    Class {className} {sectionName ? `· ${sectionName}` : ''}
                  </span>
                )}
                {className && rollNo && <span className="text-slate-300 dark:text-slate-800">|</span>}
                {rollNo && <span className="font-mono text-xs">Roll: {rollNo}</span>}
                {(className || rollNo) && enrollmentNo && <span className="text-slate-300 dark:text-slate-800">|</span>}
                {enrollmentNo && <span className="font-mono text-[10px] sm:text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 px-2 py-0.5 rounded-lg">{enrollmentNo}</span>}
              </div>
              <p className="mt-1 text-[11px] sm:text-xs font-medium text-slate-450 dark:text-slate-500">{institute?.name || 'EDDVA School Portal'}</p>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-emerald-100 bg-emerald-50/30 text-emerald-700 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 shadow-sm shadow-emerald-500/5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
        </div>
      </section>

      {/* Top-line metric stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        {/* Attendance Card */}
        <div className="relative overflow-hidden p-3 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50/30 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/80 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-300 hidden sm:block">
            <Calendar size={64} className="text-blue-600 dark:text-blue-400" />
          </div>
          <p className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <Calendar className="size-3 sm:size-4 text-blue-500" />
            <span className="truncate">Attendance</span>
          </p>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
            <p className="text-base sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {student.attendancePercentage !== null && student.attendancePercentage !== undefined 
                ? `${student.attendancePercentage}%` 
                : '—'}
            </p>
            {student.attendancePercentage === null && (
              <button 
                onClick={handleRequestEdit}
                className="text-[10px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                + Add
              </button>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500 leading-normal hidden sm:block">
            {student.attendancePercentage !== null ? 'Overall attendance presence percentage' : 'No attendance record found'}
          </p>
        </div>

        {/* Performance Card */}
        <div className="relative overflow-hidden p-3 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50/30 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/80 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-300 hidden sm:block">
            <BarChart2 size={64} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <BarChart2 className="size-3 sm:size-4 text-emerald-500" />
            <span className="truncate">Avg Accuracy</span>
          </p>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
            <p className="text-base sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {avgAccuracy !== null ? `${avgAccuracy}%` : '—'}
            </p>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500 leading-normal hidden sm:block">
            {avgAccuracy !== null ? `Based on ${totalSessions} evaluated assessments` : 'No test sessions completed yet'}
          </p>
        </div>

        {/* Academic Year Card */}
        <div className="relative overflow-hidden p-3 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50/30 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/80 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-300 hidden sm:block">
            <GraduationCap size={64} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <GraduationCap className="size-3 sm:size-4 text-indigo-500" />
            <span className="truncate">Acad Year</span>
          </p>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
            <p className="text-base sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {profile.academicYear || '—'}
            </p>
            {!profile.academicYear && (
              <button 
                onClick={handleRequestEdit}
                className="text-[10px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                + Add
              </button>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500 leading-normal hidden sm:block">
            Current calendar year
          </p>
        </div>
      </div>

      {/* Main details sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal & Academic Details */}
        <section className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 shadow-xl shadow-slate-100/50 dark:border-slate-800/80 dark:bg-slate-950 dark:shadow-none space-y-5 sm:space-y-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <UserCircle className="size-5 sm:size-6 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white">Personal & Identity Details</h2>
              <p className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500">Essential identity and enrollment values.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <ProfileField label="Full Name" value={user?.name} icon={User} onRequestEdit={handleRequestEdit} />
            <ProfileField label="Student ID / User ID" value={user?.id} icon={Shield} onRequestEdit={handleRequestEdit} />
            <ProfileField label="Roll Number" value={rollNo} icon={GraduationCap} onRequestEdit={handleRequestEdit} />
            <ProfileField label="National ID" value={profile.nationalId} icon={ShieldCheck} onRequestEdit={handleRequestEdit} />
            <ProfileField label="Primary Contact Phone" value={user?.phone} icon={Smartphone} onRequestEdit={handleRequestEdit} />
            <ProfileField label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''} icon={Calendar} onRequestEdit={handleRequestEdit} />
          </div>

          {/* Subjects Card */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/10 p-3.5 sm:p-5 dark:border-slate-800/50">
            <h3 className="text-[10px] sm:text-xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5 sm:mb-3 flex items-center gap-2">
              <BookOpen className="size-3.5 sm:size-4 text-blue-500" />
              Academic Curriculum Subjects
            </h3>
            {subjectsList.length === 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500 italic">No subjects assigned yet</span>
                <button 
                  onClick={handleRequestEdit}
                  className="text-[10px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  + Add
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 items-center">
                {(showAllSubjects ? subjectsList : visibleSubjects).map((sub, idx) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 rounded-xl bg-blue-50/50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-[10px] sm:text-xs font-bold border border-blue-100/50 dark:border-blue-900/50 shadow-sm"
                  >
                    {sub}
                  </span>
                ))}
                {!showAllSubjects && overflowCount > 0 && (
                  <button 
                    onClick={() => setShowAllSubjects(true)}
                    className="px-2 py-1 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-205 dark:hover:bg-slate-700 text-[10px] sm:text-xs font-extrabold transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    +{overflowCount} more
                  </button>
                )}
                {showAllSubjects && subjectsList.length > maxVisibleSubjects && (
                  <button 
                    onClick={() => setShowAllSubjects(false)}
                    className="px-2 py-1 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-205 dark:hover:bg-slate-700 text-[10px] sm:text-xs font-extrabold transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    Show Less
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Parent / Guardian Information */}
        <section className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 shadow-xl shadow-slate-100/50 dark:border-slate-800/80 dark:bg-slate-950 dark:shadow-none flex flex-col justify-between">
          <div className="space-y-5 sm:space-y-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Users className="size-5 sm:size-6 text-violet-600 dark:text-violet-400 shrink-0" />
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white">Parent & Guardian Information</h2>
                <p className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500">Contact mapping for emergency logs.</p>
              </div>
            </div>

            {!hasParentDetails ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 my-3 sm:my-4">
                <Users className="size-8 sm:size-10 text-slate-400 mb-2.5 sm:mb-3" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">No Guardian Details Found</h3>
                <p className="mt-1.5 text-[10px] sm:text-xs text-slate-450 dark:text-slate-500 max-w-xs leading-normal">Family contact details and emergency parent records are currently missing from the portal.</p>
                <button 
                  onClick={handleRequestEdit}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-xs font-bold transition-all shadow-md shadow-blue-500/10 hover:scale-102 active:scale-98"
                >
                  Request to Add Details
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <ProfileField label="Parent / Guardian Name" value={parentName} icon={User} onRequestEdit={handleRequestEdit} />
                <ProfileField label="Contact Details" value={parentContact} icon={Smartphone} onRequestEdit={handleRequestEdit} />
                <ProfileField label="Email Address" value={parentEmail} icon={Mail} onRequestEdit={handleRequestEdit} />
                <ProfileField label="Relationship" value={parentRelation} icon={Users} onRequestEdit={handleRequestEdit} />
              </div>
            )}
          </div>

          {/* Security details (nested in layout card footer) */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 sm:pt-6 mt-4 sm:mt-6 space-y-3 sm:space-y-4">
            <h3 className="text-[10px] sm:text-xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="size-3.5 sm:size-4 text-emerald-500" />
              Security Settings
            </h3>
            <div className="space-y-2.5 sm:space-y-3">
              <button 
                onClick={() => {
                  toast.success("A password reset link has been sent to your registered email.");
                }}
                className="flex w-full items-center justify-between rounded-xl sm:rounded-2xl border border-slate-100 p-3.5 sm:p-4 bg-slate-50/20 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-800/50 transition-all font-bold text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
                  <KeyRound className="size-4 sm:size-5 text-blue-500" />
                  Change Password
                </span>
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Send Link →</span>
              </button>

              <button 
                onClick={() => {
                  toast.info("Your account is currently active on 1 device session.");
                }}
                className="flex w-full items-center justify-between rounded-xl sm:rounded-2xl border border-slate-100 p-3.5 sm:p-4 bg-slate-50/20 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-800/50 transition-all font-bold text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
                  <Smartphone className="size-4 sm:size-5 text-emerald-500" />
                  Review Device Sessions
                </span>
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Review →</span>
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
