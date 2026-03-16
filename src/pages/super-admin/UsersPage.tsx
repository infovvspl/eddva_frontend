import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Users, Shield, GraduationCap, BookOpen, 
  MoreHorizontal, ChevronLeft, ChevronRight, Eye, 
  Ban, Mail, Filter, Download, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";

const allUsers = [
  { id: "1", name: "Arjun Mehta", phone: "+91 98765 43210", role: "super_admin", status: "active", institute: "Apex HQ", lastLogin: "2 hours ago" },
  { id: "2", name: "Priya Sharma", phone: "+91 98765 43211", role: "institute_admin", status: "active", institute: "Elite IIT Academy", lastLogin: "30 min ago" },
  { id: "3", name: "Dr. Rajesh Kumar", phone: "+91 98765 43212", role: "teacher", status: "active", institute: "Elite IIT Academy", lastLogin: "1 hour ago" },
  { id: "4", name: "Rahul Verma", phone: "+91 98765 43213", role: "student", status: "active", institute: "Elite IIT Academy", lastLogin: "5 min ago" },
  { id: "5", name: "Sneha Patel", phone: "+91 98765 43214", role: "teacher", status: "active", institute: "MedPrep Institute", lastLogin: "3 hours ago" },
  { id: "6", name: "Vikram Rathore", phone: "+91 98765 43215", role: "student", status: "suspended", institute: "Quantum Coaching", lastLogin: "2 days ago" },
  { id: "7", name: "Ananya Singh", phone: "+91 98765 43216", role: "student", status: "active", institute: "Elite IIT Academy", lastLogin: "10 min ago" },
];

const roleConfig: Record<string, { icon: any, color: string, label: string }> = {
  super_admin: { icon: Shield, color: "text-rose-600 bg-rose-50 border-rose-100", label: "Super Admin" },
  institute_admin: { icon: Users, color: "text-purple-600 bg-purple-50 border-purple-100", label: "Partner" },
  teacher: { icon: GraduationCap, color: "text-indigo-600 bg-indigo-50 border-indigo-100", label: "Faculty" },
  student: { icon: BookOpen, color: "text-emerald-600 bg-emerald-50 border-emerald-100", label: "Student" },
};

const UsersPage = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = allUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:row sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">User Directory</h1>
            <p className="text-slate-500 font-medium">Manage permissions across {allUsers.length} platform members</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 px-4 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button className="h-11 px-6 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-200">
              <UserPlus className="w-4 h-4 mr-2" /> Add User
            </Button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" 
              placeholder="Search by name, phone or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-slate-50 border-transparent rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            <select
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-11 px-4 bg-slate-50 border-transparent rounded-xl text-sm font-bold outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admins</option>
              <option value="institute_admin">Partners</option>
              <option value="teacher">Faculty</option>
              <option value="student">Students</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="text-left px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">User Details</th>
                  <th className="text-left px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Access Role</th>
                  <th className="text-left px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Organization</th>
                  <th className="text-left px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="text-left px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Last Active</th>
                  <th className="px-6 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filtered.map((user, i) => {
                    const config = roleConfig[user.role] || roleConfig.student;
                    const Icon = config.icon;
                    return (
                      <motion.tr 
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-black text-slate-600 border border-white shadow-sm">
                              {user.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 leading-none mb-1">{user.name}</p>
                              <p className="text-xs font-bold text-slate-400">{user.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-tight ${config.color}`}>
                            <Icon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-600">
                          {user.institute}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                            <span className={`text-[11px] font-black uppercase tracking-widest ${user.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {user.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">
                          {user.lastLogin}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View Profile">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Suspend User">
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
          </div>
          
          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">Showing {filtered.length} of {allUsers.length} entries</p>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white bg-white shadow-sm">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;