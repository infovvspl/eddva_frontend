import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Building2, Users, GraduationCap, Calendar, Mail, Globe, 
  Shield, CreditCard, BarChart3, Ban, ArrowUpCircle, Trash2,
  TrendingUp, BookOpen, Swords
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import type { StatCardData } from "@/lib/types";

const instituteData = {
  id: "1", name: "Elite IIT Academy", subdomain: "elite-iit", plan: "Scale",
  status: "active" as const, billingEmail: "admin@eliteiit.com", adminPhone: "+919876543210",
  students: 1284, studentLimit: 2000, teachers: 24, teacherLimit: 50,
  batches: 12, activeBatches: 8, joinedAt: "2024-12-15",
  trialEndsAt: null, lastPayment: "2025-02-28", nextPayment: "2025-03-28",
  monthlyRevenue: 19999,
};

const stats: StatCardData[] = [
  { label: "Students", value: "1,284", trend: 12, icon: Users, color: "primary" },
  { label: "Teachers", value: 24, trend: 4, icon: GraduationCap, color: "info" },
  { label: "Active Batches", value: 8, icon: BookOpen, color: "success" },
  { label: "Battles Played", value: "4.2K", trend: 22, icon: Swords, color: "ai" },
];

const teachers = [
  { name: "Dr. Rajesh Kumar", subject: "Physics", students: 342, rating: 4.8 },
  { name: "Ms. Sneha Patel", subject: "Chemistry", students: 289, rating: 4.6 },
  { name: "Mr. Arjun Singh", subject: "Mathematics", students: 378, rating: 4.9 },
  { name: "Dr. Meera Iyer", subject: "Biology", students: 275, rating: 4.7 },
];

const recentActivity = [
  { text: "New batch 'JEE-2026 Evening' created", time: "2h ago" },
  { text: "Dr. Kumar uploaded 3 new lectures", time: "5h ago" },
  { text: "45 students joined via invite link", time: "1d ago" },
  { text: "Monthly payment of ₹19,999 received", time: "3d ago" },
  { text: "Battle tournament completed — 234 participants", time: "5d ago" },
];

const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  trial: "bg-warning/10 text-warning border-warning/20",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
};

const InstituteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const inst = instituteData;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "teachers", label: "Teachers" },
    { id: "billing", label: "Billing" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title={inst.name}
        subtitle={`${inst.subdomain}.apexiq.in`}
        backPath="/super-admin/tenants"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm"><ArrowUpCircle className="w-3.5 h-3.5" /> Upgrade</Button>
            <Button variant="destructive" size="sm"><Ban className="w-3.5 h-3.5" /> Suspend</Button>
          </div>
        }
      />

      {/* Meta badges */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyles[inst.status]}`}>
          {inst.status}
        </span>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-primary/10 text-primary border-primary/20">
          {inst.plan} Plan
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" /> Joined {new Date(inst.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-surface p-5">
            <h3 className="font-semibold text-foreground mb-4">Institute Details</h3>
            <div className="space-y-3">
              {[
                { icon: Building2, label: "Name", value: inst.name },
                { icon: Globe, label: "Subdomain", value: `${inst.subdomain}.apexiq.in` },
                { icon: Mail, label: "Billing Email", value: inst.billingEmail },
                { icon: Shield, label: "Admin Phone", value: inst.adminPhone },
                { icon: Users, label: "Students", value: `${inst.students} / ${inst.studentLimit}` },
                { icon: GraduationCap, label: "Teachers", value: `${inst.teachers} / ${inst.teacherLimit}` },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 py-2">
                  <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground w-28">{item.label}</span>
                  <span className="text-sm text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface p-5">
            <h3 className="font-semibold text-foreground mb-4">Usage</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Students</span>
                  <span className="text-foreground font-medium">{inst.students} / {inst.studentLimit}</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(inst.students / inst.studentLimit) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Teachers</span>
                  <span className="text-foreground font-medium">{inst.teachers} / {inst.teacherLimit}</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-info rounded-full" style={{ width: `${(inst.teachers / inst.teacherLimit) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Batches</span>
                  <span className="text-foreground font-medium">{inst.activeBatches} active / {inst.batches} total</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: `${(inst.activeBatches / inst.batches) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "teachers" && (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Teacher</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Subject</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Students</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.name} className="border-b border-border last:border-0 hover:bg-foreground/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center text-xs font-bold text-info">
                        {t.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.subject}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.students}</td>
                  <td className="px-4 py-3">
                    <span className="text-warning font-medium">⭐ {t.rating}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-surface p-5">
            <h3 className="font-semibold text-foreground mb-4">Billing Info</h3>
            <div className="space-y-3">
              {[
                { icon: CreditCard, label: "Plan", value: `${inst.plan} — ₹${inst.monthlyRevenue.toLocaleString()}/mo` },
                { icon: Calendar, label: "Last Payment", value: new Date(inst.lastPayment).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                { icon: Calendar, label: "Next Payment", value: new Date(inst.nextPayment).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                { icon: Mail, label: "Billing Email", value: inst.billingEmail },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 py-2">
                  <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground w-32">{item.label}</span>
                  <span className="text-sm text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card-surface p-5">
            <h3 className="font-semibold text-foreground mb-4">Payment History</h3>
            <div className="space-y-2">
              {["Feb 2025", "Jan 2025", "Dec 2024"].map((month) => (
                <div key={month} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-foreground">{month}</span>
                  <span className="text-sm font-medium text-success">₹19,999 · Paid</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="card-surface p-5">
          <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InstituteDetailPage;
