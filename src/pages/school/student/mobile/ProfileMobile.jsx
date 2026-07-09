import React from 'react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { BookOpen, GraduationCap, UserCircle, Users, Mail, Smartphone, MapPin } from 'lucide-react';

export default function ProfileMobile({
  user,
  institute,
  studentData,
  loading,
  showAllSubjects,
  setShowAllSubjects,
  handleRequestEdit,
}) {
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading Profile...</p>
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

  const subjectsList = profile.subjects || [];

  return (
    <div className="space-y-6 pb-24">
      {/* Profile Header Card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 text-center flex flex-col items-center">
        <div className="relative h-20 w-20 rounded-2xl border-2 border-blue-100 bg-blue-50/50 p-0.5 shadow-sm dark:border-blue-900">
          <ProfileAvatar name={user?.name || 'S'} className="h-full w-full rounded-xl" />
        </div>
        <h2 className="text-lg font-black text-slate-800 dark:text-white mt-3">{user?.name || 'Student'}</h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Roll No: {rollNo || 'N/A'}</p>

        {/* Badges for Class and Section */}
        <div className="mt-4 flex gap-2">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 uppercase dark:bg-blue-950/40 dark:text-blue-400">
            {className || 'Class N/A'}
          </span>
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Section {sectionName || 'N/A'}
          </span>
        </div>
      </div>

      {/* Student Details Stack */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Student Profile</h3>

        <div className="grid grid-cols-1 gap-3 text-xs">
          <div className="flex items-center gap-3 bg-slate-50/40 p-3 rounded-xl dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40">
            <GraduationCap size={16} className="text-slate-400" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Enrollment No</p>
              <p className="font-bold text-slate-800 dark:text-white truncate mt-0.5">{enrollmentNo || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50/40 p-3 rounded-xl dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40">
            <Mail size={16} className="text-slate-400" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
              <p className="font-bold text-slate-800 dark:text-white truncate mt-0.5">{user?.email || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50/40 p-3 rounded-xl dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40">
            <Smartphone size={16} className="text-slate-400" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
              <p className="font-bold text-slate-800 dark:text-white truncate mt-0.5">{user?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Parents Details Stack */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Parents Information</h3>
        <div className="grid grid-cols-1 gap-3 text-xs">
          <div className="flex items-center gap-3 bg-slate-50/40 p-3 rounded-xl dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40">
            <Users size={16} className="text-slate-400" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Father's Name</p>
              <p className="font-bold text-slate-800 dark:text-white mt-0.5">{parents.fatherName || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50/40 p-3 rounded-xl dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40">
            <Users size={16} className="text-slate-400" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mother's Name</p>
              <p className="font-bold text-slate-800 dark:text-white mt-0.5">{parents.motherName || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Subjects list */}
      {subjectsList.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Enrolled Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {subjectsList.map((sub, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <BookOpen size={12} className="text-slate-400" />
                {sub.name || sub}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
