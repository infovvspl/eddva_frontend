import React from 'react';
import { Mail, Phone, Shield, BookOpen, Users, ClipboardList } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

export default function TeacherProfileMobile({
  user,
  profile,
  avatarUrl,
  stats,
  groupedAssignments,
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Teacher Profile</h2>
        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">My details & assigned schedule</p>
      </div>

      {/* Profile Details Container */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-4">
        {/* Avatar and Info */}
        <div className="flex flex-col items-center gap-3">
          <ProfileAvatar
            src={avatarUrl}
            name={profile.name}
            size="lg"
            className="h-20 w-20 rounded-full object-cover border-2 border-blue-500"
          />
          <div className="text-center">
            <h3 className="text-base font-black text-slate-850 dark:text-white leading-tight">
              {profile.name || 'Teacher Name'}
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-1">ID: {profile.employeeId || 'N/A'}</p>
          </div>
        </div>

        {/* Input/Read-only Fields */}
        <div className="space-y-3.5 pt-2 border-t border-slate-50 dark:border-slate-850/80">
          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Email Address</label>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-1 flex items-center gap-2">
              <Mail size={13} className="text-slate-400" />
              {profile.email}
            </p>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Phone Number</label>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-1 flex items-center gap-2">
              <Phone size={13} className="text-slate-400" />
              {profile.phone || 'N/A'}
            </p>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Qualifications</label>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-1">
              {profile.qualifications || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900">
          <p className="text-[9px] font-bold text-slate-400">Attendance Rate</p>
          <p className="text-lg font-black text-blue-600 mt-0.5">{stats.attendancePercentage || 0}%</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900">
          <p className="text-[9px] font-bold text-slate-400">Classes Conducted</p>
          <p className="text-lg font-black text-emerald-600 mt-0.5">{stats.classesConducted || 0}</p>
        </div>
      </div>

      {/* Assigned Classes */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Assigned Classes</h2>
        {groupedAssignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-850 dark:bg-slate-900/50">
            <p className="text-xs font-bold text-slate-500">No classes assigned.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedAssignments.map((group, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-850 dark:text-white">
                    {group.className} - {group.sectionName}
                  </h3>
                  {group.isClassTeacher && (
                    <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[8px] font-black uppercase text-emerald-700 dark:bg-emerald-950/20">
                      Class Teacher
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-50 dark:border-slate-800/80">
                  {group.subjects.map((sub, sIdx) => (
                    <span key={sIdx} className="rounded-md bg-blue-50/80 px-2 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-950/20 dark:text-blue-300">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
