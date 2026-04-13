import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, Shield, GraduationCap, BookOpen,
  ChevronLeft, ChevronRight, Eye, Ban, Filter, Download, UserPlus, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUsers, useSuspendUser, useActivateUser } from "@/hooks/use-users";

const roleConfig: Record<string, { icon: any; color: string; label: string }> = {
  super_admin: { icon: Shield, color: "text-slate-900 bg-slate-100 border-slate-200 shadow-sm", label: "Core Admin" },
  institute_admin: { icon: Users, color: "text-indigo-600 bg-indigo-50 border-indigo-100", label: "Institute Partner" },
  teacher: { icon: GraduationCap, color: "text-purple-600 bg-purple-50 border-purple-100", label: "Faculty Hub" },
  student: { icon: BookOpen, color: "text-emerald-600 bg-emerald-50 border-emerald-100", label: "Academic Learner" },
};

const UsersPage = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: usersData, isLoading, error } = useUsers({
    role: roleFilter !== "all" ? roleFilter : undefined,
    search: search || undefined,
  });
  const suspendUser = useSuspendUser();
  const activateUser = useActivateUser();

  const allUsers = (usersData as any)?.items || (Array.isArray(usersData) ? usersData : []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    if (currentStatus === "suspended") {
      await activateUser.mutateAsync(userId);
    } else {
      await suspendUser.mutateAsync(userId);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:row sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-10">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-2">Platform Control</h2>
            <h1 className="text-[42px] font-black text-slate-900 tracking-tight leading-tight">Master Directory</h1>
            <p className="text-slate-400 text-[17px] mt-1 font-semibold">Managing permissions for global educational members</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="h-14 px-8 rounded-2xl border-2 border-slate-100 font-black text-slate-600 hover:bg-slate-50 transition-all text-[15px]">
              <Download className="w-5 h-5 mr-3" /> Export Logs
            </Button>
            <Button className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 shadow-2xl transition-all text-[15px]">
              <UserPlus className="w-5 h-5 mr-3" /> Provision New Account
            </Button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 mb-8 flex flex-wrap items-center gap-6">
          <div className="relative flex-1 min-w-[320px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="text"
              placeholder="Search by full name, phone, or unique ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-[24px] text-[15px] font-semibold text-slate-800 placeholder:text-slate-300 focus:border-indigo-500/30 transition-all outline-none shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-14 px-6 bg-white border border-slate-100 rounded-[24px] text-[14px] font-black text-slate-600 outline-none cursor-pointer hover:bg-slate-50 transition-all shadow-sm uppercase tracking-tight"
            >
              <option value="all">Every Role</option>
              <option value="super_admin">Core Admins</option>
              <option value="institute_admin">Partnerships</option>
              <option value="teacher">Active Faculty</option>
              <option value="student">Academic Hub</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-[44px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Failed to load users.</div>
            ) : allUsers.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">No users found.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    <th className="text-left px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground">User Details</th>
                    <th className="text-left px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Access Role</th>
                    <th className="text-left px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Organization</th>
                    <th className="text-left px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="text-left px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Last Active</th>
                    <th className="px-6 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <AnimatePresence>
                    {allUsers.map((user: any, i: number) => {
                      const role = (user.role || "").toLowerCase();
                      const config = roleConfig[role] || roleConfig.student;
                      const Icon = config.icon;
                      const name = user.fullName || "Unknown Member";
                      const phone = user.phoneNumber || "No Data";
                      const userStatus = (user.status || "active").toLowerCase();
                      return (
                        <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-[18px] bg-slate-100 flex items-center justify-center text-[13px] font-black text-slate-400 border border-slate-50 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-[15px] font-black text-slate-900 leading-tight mb-1.5">{name}</p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-[12px] border text-[10px] font-black uppercase tracking-[0.1em] shadow-sm ${config.color}`}>
                              <Icon className="w-3.5 h-3.5" /> {config.label}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-[14px] font-black text-slate-700 leading-tight">{user.tenant?.name || "Global Core"}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{user.tenant?.subdomain ? `${user.tenant.subdomain}.edva.in` : "PLATFORM_WIDE"}</p>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-2 h-2 rounded-full ${userStatus === "active" ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-rose-500 shadow-[0_0_12px_rgba(225,29,72,0.4)]"}`} />
                              <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${userStatus === "active" ? "text-emerald-600" : "text-rose-600"}`}>
                                {userStatus === 'active' ? 'Verified' : 'Suspended'}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-[12px] font-black text-slate-400 tracking-tight">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "Never Accessed"}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                              <button className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-indigo-600 hover:shadow-lg rounded-[14px] transition-all" title="View Audit Logs">
                                <Eye className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(user.id, userStatus)}
                                className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 hover:shadow-lg rounded-[14px] transition-all"
                                title={userStatus === "suspended" ? "Reinstate Access" : "Revoke Access"}
                              >
                                <Ban className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          <div className="px-6 py-4 bg-secondary/30 border-t border-border flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground">Showing {allUsers.length} entries</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
