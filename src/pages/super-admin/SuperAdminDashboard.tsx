import { motion } from "framer-motion";
import { Building2, Users, GraduationCap, DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import type { StatCardData } from "@/lib/types";

const stats: StatCardData[] = [
  { label: "Total Institutes", value: 48, trend: 12, icon: Building2, color: "primary" },
  { label: "Active Institutes", value: 42, trend: 5, icon: Building2, color: "success" },
  { label: "Total Students", value: "52.4K", trend: 18, icon: Users, color: "info" },
  { label: "Platform MRR", value: "₹24.8L", trend: 22, icon: DollarSign, color: "warning" },
];

const recentInstitutes = [
  { name: "Elite IIT Academy", subdomain: "elite-iit", plan: "Scale", students: 1284, status: "active" as const, joined: "Dec 2024" },
  { name: "MedPrep Institute", subdomain: "medprep", plan: "Growth", students: 856, status: "active" as const, joined: "Jan 2025" },
  { name: "Quantum Coaching", subdomain: "quantum", plan: "Starter", students: 234, status: "trial" as const, joined: "Feb 2025" },
  { name: "Apex Science Hub", subdomain: "apex-sci", plan: "Growth", students: 0, status: "suspended" as const, joined: "Nov 2024" },
];

const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  trial: "bg-warning/10 text-warning border-warning/20",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
};

const SuperAdminDashboard = () => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <PageHeader title="Platform Overview" subtitle="APEXIQ Super Admin Dashboard" />

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
          <StatCard {...s} />
        </motion.div>
      ))}
    </div>

    <div className="card-surface">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Recent Institutes</h3>
        <button className="text-sm text-primary font-medium hover:underline">View All</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Institute</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Subdomain</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Plan</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Students</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {recentInstitutes.map((inst) => (
              <tr key={inst.subdomain} className="border-b border-border last:border-0 hover:bg-foreground/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{inst.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{inst.subdomain}</td>
                <td className="px-4 py-3 text-muted-foreground">{inst.plan}</td>
                <td className="px-4 py-3 text-muted-foreground">{inst.students.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusStyles[inst.status]}`}>
                    {inst.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{inst.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </motion.div>
);

export default SuperAdminDashboard;
