import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/SchoolAuthContext';
import { 
  BookOpen, GraduationCap, KeyRound, ShieldCheck, UserCircle, Users, 
  BarChart2, Calendar, Shield, Mail, Smartphone, MapPin, User, AlertCircle
} from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import schoolApi from '@/lib/api/school-client';
import { toast } from 'sonner';

function ProfileField({ label, value, icon: Icon, onRequestEdit }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-800 dark:bg-slate-900/10 flex flex-col justify-between min-h-[90px] hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
      <div>
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
          {label}
        </p>
        <p className="mt-1.5 truncate text-sm font-bold text-slate-900 dark:text-white">
          {value || <span className="text-slate-400 dark:text-slate-500 italic font-medium">Not specified</span>}
        </p>
      </div>
      {!value && (
        <button 
          onClick={onRequestEdit}
          className="mt-2 self-start text-[10px] font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 uppercase tracking-wider transition-colors"
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
      <section className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50 dark:border-slate-800/80 dark:bg-slate-950 dark:shadow-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-blue-500/10 to-indigo-500/0 blur-2xl rounded-full" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {user?.profileImage ? (
              <ProfileAvatar
                src={user.profileImage}
                name={user?.name}
                className="h-20 w-20 shrink-0 rounded-2xl border border-slate-200/50 shadow-md shadow-blue-500/5"
                fallbackClassName="text-2xl font-black text-blue-700 dark:text-blue-300"
              />
            ) : (
              <ProfileAvatar
                name={user?.name}
                className="h-20 w-20 shrink-0 rounded-2xl border border-slate-200/50 bg-blue-50/50 shadow-md shadow-blue-500/5"
                fallbackClassName="text-2xl font-black text-blue-700 dark:text-blue-300"
              />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">{user?.name || 'Student'}</h1>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {className && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    Class {className} {sectionName ? `· ${sectionName}` : ''}
                  </span>
                )}
                {className && rollNo && <span className="text-slate-300 dark:text-slate-800">|</span>}
                {rollNo && <span className="font-mono text-xs">Roll: {rollNo}</span>}
                {(className || rollNo) && enrollmentNo && <span className="text-slate-300 dark:text-slate-800">|</span>}
                {enrollmentNo && <span className="font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 px-2 py-0.5 rounded-lg">{enrollmentNo}</span>}
              </div>
              <p className="mt-1 text-xs font-medium text-slate-450 dark:text-slate-500">{institute?.name || 'EDDVA School Portal'}</p>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-100 bg-emerald-50/30 text-emerald-700 text-xs font-extrabold uppercase tracking-wider dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 shadow-sm shadow-emerald-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
        </div>
      </section>

      {/* Top-line metric stats */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Attendance Card */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-slate-50/30 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/80 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <Calendar size={64} className="text-blue-600 dark:text-blue-400" />
          </div>
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <Calendar className="h-4 w-4 text-blue-500" />
            Attendance Rate
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {student.attendancePercentage !== null && student.attendancePercentage !== undefined 
                ? `${student.attendancePercentage}%` 
                : '—'}
            </p>
            {student.attendancePercentage === null && (
              <button 
                onClick={handleRequestEdit}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                + Add
              </button>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500 leading-normal">
            {student.attendancePercentage !== null ? 'Overall attendance presence percentage' : 'No attendance record found'}
          </p>
        </div>

        {/* Performance Card */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-slate-50/30 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/80 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <BarChart2 size={64} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <BarChart2 className="h-4 w-4 text-emerald-500" />
            Avg Accuracy
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {avgAccuracy !== null ? `${avgAccuracy}%` : '—'}
            </p>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500 leading-normal">
            {avgAccuracy !== null ? `Based on ${totalSessions} evaluated assessments` : 'No test sessions completed yet'}
          </p>
        </div>

        {/* Academic Year Card */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-slate-50/30 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/80 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <GraduationCap size={64} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <GraduationCap className="h-4 w-4 text-indigo-500" />
            Academic Year
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {profile.academicYear || '—'}
            </p>
            {!profile.academicYear && (
              <button 
                onClick={handleRequestEdit}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                + Add
              </button>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500 leading-normal">
            Current enrollment calendar year
          </p>
        </div>
      </div>

      {/* Main details sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal & Academic Details */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50 dark:border-slate-800/80 dark:bg-slate-950 dark:shadow-none space-y-6">
          <div className="flex items-center gap-3">
            <UserCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white">Personal & Identity Details</h2>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Essential identity and enrollment values.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileField label="Full Name" value={user?.name} icon={User} onRequestEdit={handleRequestEdit} />
            <ProfileField label="Student ID / User ID" value={user?.id} icon={Shield} onRequestEdit={handleRequestEdit} />
            <ProfileField label="Roll Number" value={rollNo} icon={GraduationCap} onRequestEdit={handleRequestEdit} />
            <ProfileField label="National ID" value={profile.nationalId} icon={ShieldCheck} onRequestEdit={handleRequestEdit} />
            <ProfileField label="Primary Contact Phone" value={user?.phone} icon={Smartphone} onRequestEdit={handleRequestEdit} />
            <ProfileField label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''} icon={Calendar} onRequestEdit={handleRequestEdit} />
          </div>

          {/* Subjects Card */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/10 p-5 dark:border-slate-800/50">
            <h3 className="text-xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              Academic Curriculum Subjects
            </h3>
            {subjectsList.length === 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 italic">No subjects assigned yet</span>
                <button 
                  onClick={handleRequestEdit}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  + Add
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 items-center">
                {(showAllSubjects ? subjectsList : visibleSubjects).map((sub, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1.5 rounded-xl bg-blue-50/50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-bold border border-blue-100/50 dark:border-blue-900/50 shadow-sm"
                  >
                    {sub}
                  </span>
                ))}
                {!showAllSubjects && overflowCount > 0 && (
                  <button 
                    onClick={() => setShowAllSubjects(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-205 dark:hover:bg-slate-700 text-xs font-extrabold transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    +{overflowCount} more
                  </button>
                )}
                {showAllSubjects && subjectsList.length > maxVisibleSubjects && (
                  <button 
                    onClick={() => setShowAllSubjects(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-205 dark:hover:bg-slate-700 text-xs font-extrabold transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    Show Less
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Parent / Guardian Information */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50 dark:border-slate-800/80 dark:bg-slate-950 dark:shadow-none flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              <div>
                <h2 className="text-base font-extrabold text-slate-950 dark:text-white">Parent & Guardian Information</h2>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Contact mapping for emergency logs.</p>
              </div>
            </div>

            {!hasParentDetails ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 my-4">
                <Users className="h-10 w-10 text-slate-400 mb-3" />
                <h3 className="text-sm font-bold text-slate-950 dark:text-white">No Guardian Details Found</h3>
                <p className="mt-1.5 text-xs text-slate-450 dark:text-slate-500 max-w-xs leading-normal">Family contact details and emergency parent records are currently missing from the portal.</p>
                <button 
                  onClick={handleRequestEdit}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 hover:scale-102 active:scale-98"
                >
                  Request to Add Details
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileField label="Parent / Guardian Name" value={parentName} icon={User} onRequestEdit={handleRequestEdit} />
                <ProfileField label="Contact Details" value={parentContact} icon={Smartphone} onRequestEdit={handleRequestEdit} />
                <ProfileField label="Email Address" value={parentEmail} icon={Mail} onRequestEdit={handleRequestEdit} />
                <ProfileField label="Relationship" value={parentRelation} icon={Users} onRequestEdit={handleRequestEdit} />
              </div>
            )}
          </div>

          {/* Security details (nested in layout card footer) */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 mt-6 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Security Settings
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  toast.success("A password reset link has been sent to your registered email.");
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-100 p-4 bg-slate-50/20 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-800/50 transition-all font-bold text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-3 text-sm">
                  <KeyRound className="h-5 w-5 text-blue-500" />
                  Change Password
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Send Link →</span>
              </button>

              <button 
                onClick={() => {
                  toast.info("Your account is currently active on 1 device session.");
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-100 p-4 bg-slate-50/20 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-800/50 transition-all font-bold text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-3 text-sm">
                  <Smartphone className="h-5 w-5 text-emerald-500" />
                  Review Device Sessions
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Review →</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
