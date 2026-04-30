import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, Shield, GraduationCap, BookOpen,
  ChevronLeft, ChevronRight, Eye, Ban, Filter, Download, UserPlus, Loader2, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUsers, useSuspendUser, useActivateUser, useDeleteUser } from "@/hooks/use-users";

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
  const deleteUser = useDeleteUser();

  const allUsers = (usersData as any)?.items || (Array.isArray(usersData) ? usersData : []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    if (currentStatus === "suspended") {
      await activateUser.mutateAsync(userId);
    } else {
      await suspendUser.mutateAsync(userId);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`)) {
      try {
        await deleteUser.mutateAsync(userId);
      } catch (err: any) {
        alert(err?.response?.data?.message || "Failed to delete user.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-7 md:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 md:pb-8">
          <div>
            <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-2">Platform Control</h2>
            <h1 className="text-[26px] md:text-[34px] lg:text-[40px] font-black text-slate-900 tracking-tight leading-tight">Master Directory</h1>
            <p className="text-slate-400 text-sm md:text-[15px] mt-1 font-semibold">Managing permissions for global educational members</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-10 md:h-12 px-5 md:px-8 rounded-2xl border-2 border-slate-100 font-black text-slate-600 hover:bg-slate-50 transition-all text-sm">
              <Download className="w-4 h-4 mr-2" /> Export Logs
            </Button>
            <Button className="h-10 md:h-12 px-5 md:px-8 bg-white text-gray-900 rounded-2xl font-black hover:bg-gray-100 shadow-2xl transition-all text-sm">
              <UserPlus className="w-4 h-4 mr-2" /> Provision Account
            </Button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="bg-slate-50/50 p-4 md:p-5 rounded-[24px] md:rounded-[32px] border border-slate-100 mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search by full name, phone, or unique ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 md:h-12 pl-11 pr-5 bg-white border border-slate-100 rounded-[16px] text-sm font-semibold text-slate-800 placeholder:text-gray-500 focus:border-indigo-500/30 transition-all outline-none shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-11 md:h-12 px-4 bg-white border border-slate-100 rounded-[16px] text-xs md:text-sm font-black text-slate-600 outline-none cursor-pointer hover:bg-slate-50 transition-all shadow-sm uppercase tracking-tight"
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
                    <th className="text-left px-5 md:px-7 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">User Details</th>
                    <th className="text-left px-5 md:px-7 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Access Role</th>
                    <th className="text-left px-5 md:px-7 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Organization</th>
                    <th className="text-left px-5 md:px-7 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="text-left px-5 md:px-7 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Last Active</th>
                    <th className="px-5 md:px-7 py-4"></th>
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
                          <td className="px-5 md:px-7 py-4">
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className="w-10 h-10 rounded-[14px] bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-50 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm shrink-0">
                                {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 leading-tight mb-0.5">{name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 md:px-7 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border text-[10px] font-black uppercase tracking-[0.1em] shadow-sm ${config.color}`}>
                              <Icon className="w-3 h-3" /> {config.label}
                            </span>
                          </td>
                          <td className="px-5 md:px-7 py-4">
                            <p className="text-sm font-black text-slate-700 leading-tight">{user.tenant?.name || "Global Core"}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tight">{user.tenant?.subdomain ? `${user.tenant.subdomain}.edva.in` : "PLATFORM_WIDE"}</p>
                          </td>
                          <td className="px-5 md:px-7 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${userStatus === "active" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.4)]"}`} />
                              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${userStatus === "active" ? "text-emerald-600" : "text-rose-600"}`}>
                                {userStatus === 'active' ? 'Verified' : 'Suspended'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 md:px-7 py-4 text-[11px] font-black text-slate-400 tracking-tight">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "Never Accessed"}
                          </td>
                          <td className="px-5 md:px-7 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                              <button className="p-2.5 bg-white border border-slate-100 text-gray-600 hover:text-indigo-600 hover:shadow-lg rounded-[12px] transition-all" title="View Audit Logs">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(user.id, userStatus)}
                                className="p-2.5 bg-white border border-slate-100 text-gray-600 hover:text-rose-600 hover:shadow-lg rounded-[12px] transition-all"
                                title={userStatus === "suspended" ? "Reinstate Access" : "Revoke Access"}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, name)}
                                className="p-2.5 bg-white border border-slate-100 text-gray-600 hover:text-red-600 hover:shadow-lg rounded-[12px] transition-all"
                                title="Delete User Permanently"
                              >
                                <Trash2 className="w-4 h-4" />
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
