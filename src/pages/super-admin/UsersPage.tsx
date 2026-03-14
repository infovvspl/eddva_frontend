import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Search, Users, Shield, GraduationCap, BookOpen, 
  MoreHorizontal, ChevronLeft, ChevronRight, Eye, Ban, Mail
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

const allUsers = [
  { id: "1", name: "Arjun Mehta", phone: "+919876543210", role: "super_admin", status: "active", institute: "—", lastLogin: "2 hours ago" },
  { id: "2", name: "Priya Sharma", phone: "+919876543211", role: "institute_admin", status: "active", institute: "Elite IIT Academy", lastLogin: "30 min ago" },
  { id: "3", name: "Dr. Rajesh Kumar", phone: "+919876543212", role: "teacher", status: "active", institute: "Elite IIT Academy", lastLogin: "1 hour ago" },
  { id: "4", name: "Rahul Verma", phone: "+919876543213", role: "student", status: "active", institute: "Elite IIT Academy", lastLogin: "5 min ago" },
  { id: "5", name: "Sneha Patel", phone: "+919876543214", role: "teacher", status: "active", institute: "MedPrep Institute", lastLogin: "3 hours ago" },
  { id: "6", name: "Vikram Rathore", phone: "+919876543215", role: "student", status: "suspended", institute: "Quantum Coaching", lastLogin: "2 days ago" },
  { id: "7", name: "Ananya Singh", phone: "+919876543216", role: "student", status: "active", institute: "Elite IIT Academy", lastLogin: "10 min ago" },
  { id: "8", name: "Deepak Joshi", phone: "+919876543217", role: "institute_admin", status: "active", institute: "MedPrep Institute", lastLogin: "4 hours ago" },
  { id: "9", name: "Meera Kapoor", phone: "+919876543218", role: "student", status: "active", institute: "Pinnacle JEE Center", lastLogin: "1 hour ago" },
  { id: "10", name: "Karan Malhotra", phone: "+919876543219", role: "teacher", status: "active", institute: "Pinnacle JEE Center", lastLogin: "6 hours ago" },
];

const roleIcons: Record<string, typeof Shield> = {
  super_admin: Shield,
  institute_admin: Users,
  teacher: GraduationCap,
  student: BookOpen,
};

const roleColors: Record<string, string> = {
  super_admin: "bg-destructive/10 text-destructive border-destructive/20",
  institute_admin: "bg-ai/10 text-ai border-ai/20",
  teacher: "bg-info/10 text-info border-info/20",
  student: "bg-success/10 text-success border-success/20",
};

const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="All Users" subtitle={`${allUsers.length} users across the platform`} />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" placeholder="Search users..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
          />
        </div>
        <select
          value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 px-3 bg-card border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none"
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="institute_admin">Institute Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      </div>

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">User</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Phone</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Role</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Institute</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const RoleIcon = roleIcons[user.role] || BookOpen;
              return (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {user.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${roleColors[user.role]}`}>
                      <RoleIcon className="w-3 h-3" />
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.institute}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusStyles[user.status as keyof typeof statusStyles]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.lastLogin}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default UsersPage;
