import { motion } from "framer-motion";
import { 
  Users, Building2, DollarSign, TrendingUp, Swords, BookOpen, 
  HelpCircle, BarChart3, Activity
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import type { StatCardData } from "@/lib/types";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const topStats: StatCardData[] = [
  { label: "Total Students", value: "52.4K", trend: 18, icon: Users, color: "primary" },
  { label: "Total Teachers", value: 486, trend: 6, icon: Users, color: "info" },
  { label: "Active Institutes", value: 42, trend: 5, icon: Building2, color: "success" },
  { label: "Monthly Revenue", value: "₹24.8L", trend: 22, icon: DollarSign, color: "warning" },
  { label: "Battles Played", value: "1.2M", trend: 34, icon: Swords, color: "ai" },
  { label: "Questions Answered", value: "8.4M", trend: 15, icon: BookOpen, color: "info" },
];

const monthlyGrowth = [
  { month: "Oct", students: 38200, institutes: 34, revenue: 1680000 },
  { month: "Nov", students: 41500, institutes: 36, revenue: 1820000 },
  { month: "Dec", students: 44800, institutes: 39, revenue: 1990000 },
  { month: "Jan", students: 47200, institutes: 41, revenue: 2180000 },
  { month: "Feb", students: 50100, institutes: 43, revenue: 2340000 },
  { month: "Mar", students: 52400, institutes: 48, revenue: 2480000 },
];

const planDistribution = [
  { name: "Starter", value: 14, color: "hsl(var(--muted-foreground))" },
  { name: "Growth", value: 18, color: "hsl(var(--info))" },
  { name: "Scale", value: 12, color: "hsl(var(--primary))" },
  { name: "Enterprise", value: 4, color: "hsl(var(--ai))" },
];

const examSplit = [
  { name: "JEE", value: 62 },
  { name: "NEET", value: 34 },
  { name: "Both", value: 4 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" && entry.value > 10000 
            ? `₹${(entry.value / 100000).toFixed(1)}L` 
            : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const PlatformStatsPage = () => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <PageHeader title="Platform Statistics" subtitle="Real-time metrics across APEXIQ" />

    {/* Top Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {topStats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <StatCard {...s} />
        </motion.div>
      ))}
    </div>

    {/* Charts Row */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Student Growth */}
      <div className="card-surface p-5">
        <h3 className="font-semibold text-foreground mb-4">Student Growth</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} name="Students" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Growth */}
      <div className="card-surface p-5">
        <h3 className="font-semibold text-foreground mb-4">Monthly Revenue</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Bottom Row */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Plan Distribution */}
      <div className="card-surface p-5">
        <h3 className="font-semibold text-foreground mb-4">Plan Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
              {planDistribution.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {planDistribution.map((p) => (
            <div key={p.name} className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-muted-foreground">{p.name} ({p.value})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Exam Split */}
      <div className="card-surface p-5">
        <h3 className="font-semibold text-foreground mb-4">Student Exam Split</h3>
        <div className="space-y-4 mt-8">
          {examSplit.map((ex) => (
            <div key={ex.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground font-medium">{ex.name}</span>
                <span className="text-muted-foreground">{ex.value}%</span>
              </div>
              <div className="h-3 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    ex.name === "JEE" ? "bg-primary" : ex.name === "NEET" ? "bg-success" : "bg-ai"
                  }`}
                  style={{ width: `${ex.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Health */}
      <div className="card-surface p-5">
        <h3 className="font-semibold text-foreground mb-4">Platform Health</h3>
        <div className="space-y-3">
          {[
            { label: "API Uptime", value: "99.97%", status: "success" },
            { label: "Avg Response Time", value: "142ms", status: "success" },
            { label: "Active WebSockets", value: "8,420", status: "info" },
            { label: "AI Requests Today", value: "24.6K", status: "ai" },
            { label: "Error Rate", value: "0.03%", status: "success" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className={`text-sm font-semibold ${
                item.status === "success" ? "text-success" :
                item.status === "ai" ? "text-ai" : "text-info"
              }`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

export default PlatformStatsPage;
