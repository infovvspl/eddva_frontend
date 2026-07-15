import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { User, Mail, Phone, Settings, LogOut, Key, Bell, ChevronRight, Shield } from "lucide-react";
import { parentClient } from "@/lib/api/parent-client";
import { useAuthStore } from "@/lib/auth-store";
import { logout } from "@/lib/api/auth";
import { useParentContext } from "@/components/school/parent/ParentAuthGuard";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { uploadToS3 } from "@/lib/upload";

export default function ParentProfile() {
  const { user } = useAuthStore();
  const { children: linkedChildren } = useParentContext();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar ?? user?.profileImage ?? null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar ?? user?.profileImage ?? null);
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { data: preferences } = useQuery<any>({
    queryKey: ['parent-notification-preferences'],
    queryFn: () => parentClient.getNotificationPreferences(),
  });

  const savePreferences = useMutation({
    mutationFn: (prefs: any) => parentClient.updateNotificationPreferences(prefs),
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['parent-profile'],
    queryFn: () => parentClient.getProfile(),
  });

  useEffect(() => {
    setAvatarUrl(user?.avatar ?? user?.profileImage ?? null);
    setAvatarPreview(user?.avatar ?? user?.profileImage ?? null);
    setForm({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  }, [user?.avatar, user?.profileImage, user?.name, user?.email, user?.phone]);

  useEffect(() => {
    if (preferences?.enablePush !== undefined) {
      setNotificationsEnabled(preferences.enablePush);
    }
  }, [preferences]);

  const saveProfile = useMutation({
    mutationFn: (payload: { name?: string; email?: string; phone?: string; profileImage?: string | null }) => parentClient.updateProfile(payload),
    onSuccess: () => {
      useAuthStore.setState((state) => ({
        ...state,
        user: state.user
          ? {
              ...state.user,
              name: form.name,
              email: form.email,
              phone: form.phone,
              profileImage: avatarUrl ?? undefined,
            }
          : state.user,
      }));
      setIsEditing(false);
    },
  });

  const handleUpload = async (file: File) => {
    const tempUrl = URL.createObjectURL(file);
    setAvatarPreview(tempUrl);
    const uploaded = await uploadToS3(
      { type: 'profile', fileName: file.name, contentType: file.type, fileSize: file.size },
      file,
    );
    setAvatarUrl(uploaded);
    URL.revokeObjectURL(tempUrl);
  };

  const handleLogout = () => {
    logout();
    navigate("/school/parent/login");
  };

  return (
    <div className="space-y-6 md:space-y-8 w-full">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Profile</h2>
        <p className="text-sm font-semibold text-slate-500">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* LEFT COLUMN: Profile Info & Children */}
        <div className="md:col-span-2 space-y-6 md:space-y-8">
          
          {/* PROFILE CARD */}
          <div className="rounded-[2rem] bg-white p-6 md:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">Parent Profile</p>
                <p className="text-sm font-semibold text-slate-500">Edit your contact details and photo</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing((value) => !value)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {isEditing ? 'View' : 'Edit'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <button type="button" onClick={() => isEditing && fileRef.current?.click()} className="block">
                  <ProfileAvatar
                  src={avatarPreview}
                  name={user?.name}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-black text-blue-700 shadow-inner"
                  fallbackClassName="text-3xl font-black text-blue-700"
                  />
                </button>
                <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white border-4 border-white shadow-sm">
                  <Shield className="h-4 w-4" />
                </div>
              </div>
              <div className="text-center sm:text-left">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      value={form.name}
                      onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                      placeholder="Full name"
                    />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Parent Account</p>
                  </div>
                ) : (
                  <h3 className="text-2xl font-black text-slate-900">{user?.name || 'Parent Name'}</h3>
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {isEditing ? (
                <>
                  <label className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Email Address</span>
                    <input
                      value={form.email}
                      onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Phone Number</span>
                    <input
                      value={form.phone}
                      onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Email Address</p>
                      <p className="text-sm font-bold text-slate-900">{user?.email || profile?.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Phone Number</p>
                      <p className="text-sm font-bold text-slate-900">{user?.phone || profile?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {isEditing && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    await handleUpload(file);
                    event.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={async () => {
                    await saveProfile.mutateAsync({
                      name: form.name,
                      email: form.email,
                      phone: form.phone,
                      profileImage: avatarUrl,
                    });
                  }}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={saveProfile.isPending}
                >
                  {saveProfile.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* LINKED CHILDREN */}
          <div className="rounded-[2rem] bg-white p-6 md:p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" /> Linked Children
            </h3>
            <div className="space-y-4">
              {linkedChildren?.length > 0 ? (
                linkedChildren.map(child => (
                  <div key={child.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-lg font-black text-slate-700 shadow-sm border border-slate-100">
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-slate-900">{child.name}</p>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">Class {child.className || '--'} • Roll {child.rollNumber || '--'}</p>
                      </div>
                    </div>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm hover:text-blue-600 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 opacity-50">
                  <p className="text-sm font-bold text-slate-500">No children linked to this account.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings & Logout */}
        <div className="space-y-6 md:space-y-8">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-400" /> Settings
            </h3>
            
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between rounded-2xl p-4 text-left transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Change Password</p>
                    <p className="text-[10px] font-semibold text-slate-500">Update your security credentials</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </button>

              <div className="w-full flex items-center justify-between rounded-2xl p-4 transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    <p className="text-[10px] font-semibold text-slate-500">Manage email and push alerts</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const nextVal = !notificationsEnabled;
                    setNotificationsEnabled(nextVal);
                    localStorage.setItem("parent_notifications_enabled", String(nextVal));
                    await savePreferences.mutateAsync({
                      enableInApp: true,
                      enableEmail: nextVal,
                      enablePush: nextVal,
                    });
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notificationsEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-[1.5rem] bg-red-50 py-4 text-[15px] font-black text-red-600 hover:bg-red-100 transition-colors border border-red-100"
          >
            <LogOut className="h-5 w-5" /> Log Out
          </button>
        </div>

      </div>
    </div>
  );
}
