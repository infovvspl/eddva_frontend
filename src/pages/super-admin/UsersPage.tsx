import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, Shield, GraduationCap, BookOpen,
  ChevronLeft, ChevronRight, Eye, Ban, Filter, Download, UserPlus, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUsers, useSuspendUser, useActivateUser } from "@/hooks/use-users";

const roleConfig: Record<string, { icon: any; color: string; label: string }> = {
  super_admin: { icon: Shield, color: "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20", label: "Super Admin" },
  institute_admin: { icon: Users, color: "text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20", label: "Partner" },
  teacher: { icon: GraduationCap, color: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20", label: "Faculty" },
  student: { icon: BookOpen, color: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", label: "Student" },
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
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:row sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">User Directory</h1>
            <p className="text-muted-foreground font-medium">Manage permissions across platform members</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 px-4 rounded-xl border-border font-bold text-foreground hover:bg-secondary">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button className="h-11 px-6 bg-foreground text-background rounded-xl font-bold hover:bg-foreground/90 shadow-lg">
              <UserPlus className="w-4 h-4 mr-2" /> Add User
            </Button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="bg-card p-4 rounded-[24px] border border-border shadow-sm mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, phone or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-secondary border-transparent rounded-xl text-sm font-bold text-foreground focus:bg-background focus:ring-2 focus:ring-primary/15 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground mr-1" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-11 px-4 bg-secondary border-transparent rounded-xl text-sm font-bold text-foreground outline-none cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admins</option>
              <option value="institute_admin">Partners</option>
              <option value="teacher">Faculty</option>
              <option value="student">Students</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden">
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
                      const name = user.fullName || "Unknown";
                      const phone = user.phoneNumber || "";
                      const userStatus = (user.status || "active").toLowerCase();
                      return (
                        <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="group hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center text-xs font-black text-muted-foreground border border-border shadow-sm">
                                {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-foreground leading-none mb-1">{name}</p>
                                <p className="text-xs font-bold text-muted-foreground">{phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-tight ${config.color}`}>
                              <Icon className="w-3 h-3" /> {config.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-foreground">{user.tenant?.name || "—"}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${userStatus === "active" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500"}`} />
                              <span className={`text-[11px] font-black uppercase tracking-widest ${userStatus === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                {userStatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="View Profile">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(user.id, userStatus)}
                                className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                title={userStatus === "suspended" ? "Activate User" : "Suspend User"}
                              >
                                <Ban className="w-4 h-4" />
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
