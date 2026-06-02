import React from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Mail, Phone, Settings, LogOut, Key, Bell, ChevronRight, Shield } from "lucide-react";
import { parentClient } from "@/lib/api/parent-client";
import { useAuthStore } from "@/lib/auth-store";
import { logout } from "@/lib/api/auth";
import { useParentContext } from "@/components/school/parent/ParentAuthGuard";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParentProfile() {
  const { user } = useAuthStore();
  const { children: linkedChildren } = useParentContext();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['parent-profile'],
    queryFn: () => parentClient.getProfile(),
  });

  const handleLogout = () => {
    logout();
    navigate("/school/parent/login");
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Profile</h2>
        <p className="text-sm font-semibold text-slate-500">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        
        {/* LEFT COLUMN: Profile Info & Children */}
        <div className="md:col-span-2 space-y-6 md:space-y-8">
          
          {/* PROFILE CARD */}
          <div className="rounded-[2rem] bg-white p-6 md:p-8 shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-black text-blue-700 shadow-inner">
                  {user?.name?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white border-4 border-white shadow-sm">
                  <Shield className="h-4 w-4" />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-black text-slate-900">{user?.name || 'Parent Name'}</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Parent Account</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
            </div>
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

              <button className="w-full flex items-center justify-between rounded-2xl p-4 text-left transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    <p className="text-[10px] font-semibold text-slate-500">Manage email and push alerts</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </button>
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
