import React from 'react';
import { useAuth } from '@/context/SchoolAuthContext';
import { BookOpen, GraduationCap, KeyRound, ShieldCheck, UserCircle, Users } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">{value || '-'}</p>
    </div>
  );
}

export default function Profile() {
  const { user, institute } = useAuth();
  const profile = user?.studentProfile || user?.profile || {};

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {user?.photo ? (
            <ProfileAvatar
              src={user.photo}
              name={user?.name}
              className="h-20 w-20 shrink-0 rounded-lg border border-slate-200"
              fallbackClassName="text-2xl font-black text-blue-700 dark:text-blue-300"
            />
          ) : (
            <ProfileAvatar
              name={user?.name}
              className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 bg-blue-100"
              fallbackClassName="text-2xl font-black text-blue-700 dark:text-blue-300"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Student Profile</p>
            <h1 className="mt-1 truncate text-2xl font-black text-slate-950 dark:text-white">{user?.name || 'Student'}</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">{institute?.name || 'EDDVA School Portal'}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <UserCircle className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Personal Information</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Student identity and class placement.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoRow label="Student ID" value={profile.studentId || user?.id} />
            <InfoRow label="Roll Number" value={profile.rollNumber || profile.roll_no || user?.rollNumber} />
            <InfoRow label="Class" value={profile.className || profile.class || user?.className} />
            <InfoRow label="Section" value={profile.sectionName || profile.section || user?.sectionName} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Academic Information</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Subjects, attendance, and performance summary.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoRow label="Subjects" value={Array.isArray(profile.subjects) ? profile.subjects.join(', ') : profile.subjects} />
            <InfoRow label="Attendance" value={profile.attendance ? `${profile.attendance}%` : user?.attendance} />
            <InfoRow label="Performance" value={profile.performance ? `${profile.performance}%` : user?.performance} />
            <InfoRow label="Academic Year" value={profile.academicYear || user?.academicYear} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-violet-600" />
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Parent Information</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Guardian contact details.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoRow label="Parent Name" value={profile.parentName || user?.parentName} />
            <InfoRow label="Contact Details" value={profile.parentPhone || profile.parentContact || user?.parentPhone} />
            <InfoRow label="Email" value={profile.parentEmail || user?.parentEmail} />
            <InfoRow label="Relation" value={profile.parentRelation || user?.parentRelation} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-rose-600" />
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Security</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Password and device session controls.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <button className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
              <KeyRound className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-black text-slate-950 dark:text-white">Change Password</span>
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-black text-slate-950 dark:text-white">Review Device Sessions</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
