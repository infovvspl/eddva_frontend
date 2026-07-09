import React from 'react';
import { User, Mail, Phone, LogOut, Shield } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

export default function ParentProfileMobile({
  user,
  linkedChildren,
  isEditing,
  setIsEditing,
  avatarPreview,
  form,
  setForm,
  fileRef,
  isSaving,
  onSave,
  onLogout,
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">My Profile</h2>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Account & Kids Linked</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-350"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Profile Details Container */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-4">
        {/* Avatar and Info */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <ProfileAvatar
              src={avatarPreview}
              name={form.name}
              size="lg"
              className="h-20 w-20 rounded-full object-cover border-2 border-blue-500"
            />
            {isEditing && (
              <span className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-1.5 text-white text-[9px] font-black uppercase">
                Change
              </span>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-base font-black text-slate-850 dark:text-white leading-tight">
              {form.name || 'Parent Name'}
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-1">Parent Account</p>
          </div>
        </div>

        {/* Input/Read-only Fields */}
        <div className="space-y-3.5 pt-2 border-t border-slate-50 dark:border-slate-850/80">
          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-bold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            ) : (
              <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-1 flex items-center gap-2">
                <User size={13} className="text-slate-400" />
                {form.name}
              </p>
            )}
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Email Address</label>
            {isEditing ? (
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-bold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            ) : (
              <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-1 flex items-center gap-2">
                <Mail size={13} className="text-slate-400" />
                {form.email || 'N/A'}
              </p>
            )}
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-bold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            ) : (
              <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-1 flex items-center gap-2">
                <Phone size={13} className="text-slate-400" />
                {form.phone || 'N/A'}
              </p>
            )}
          </div>

          {isEditing && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-black text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 active:scale-98 transition-transform"
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          )}
        </div>
      </div>

      {/* Linked Children List */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Linked Students ({linkedChildren?.length || 0})</h2>
        {linkedChildren?.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-850 dark:bg-slate-900/50">
            <p className="text-xs font-bold text-slate-500">No children linked to this account.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {linkedChildren.map((child) => (
              <div
                key={child.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 flex items-center gap-3.5"
              >
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                  <img
                    src={child.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256'}
                    alt="Child Avatar"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-850 dark:text-white leading-tight">
                    {child.name}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-450 mt-1">
                    Class: {child.className} {child.sectionName} · Roll: {child.rollNumber || 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full rounded-2xl border border-rose-100 bg-rose-50/50 py-3.5 text-xs font-black text-rose-600 dark:border-rose-950/20 dark:bg-rose-950/10 dark:text-rose-400 flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
      >
        <LogOut size={15} />
        Sign Out
      </button>
    </div>
  );
}
