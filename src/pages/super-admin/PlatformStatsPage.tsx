import { motion } from "framer-motion";
import {
  Users, Building2, DollarSign, Swords, Activity, Zap, Globe, ShieldCheck, ArrowUpRight, Loader2
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { usePlatformStats } from "@/hooks/use-stats";

const monthlyGrowth = [
  { month: "Oct", students: 38200, revenue: 1680000 },
  { month: "Nov", students: 41500, revenue: 1820000 },
  { month: "Dec", students: 44800, revenue: 1990000 },
  { month: "Jan", students: 47200, revenue: 2180000 },
  { month: "Feb", students: 50100, revenue: 2340000 },
  { month: "Mar", students: 52400, revenue: 2480000 },
];

const planDistribution = [
  { name: "Starter", value: 14, color: "#94a3b8" },
  { name: "Growth", value: 18, color: "#0ea5e9" },
  { name: "Scale", value: 12, color: "#6366f1" },
  { name: "Enterprise", value: 4, color: "#a855f7" },
];

const PlatformStatsPage = () => {
  const { data: stats, isLoading } = usePlatformStats();

  const formatCount = (n: number | undefined) => {
    if (n == null) return "—";
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const topStats = [
    { label: "Total Students", value: formatCount(stats?.totalStudents), trend: "+18%", icon: Users, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
    { label: "Active Institutes", value: stats?.activeTenants ?? stats?.activeInstitutes ?? "—", trend: "+5%", icon: Building2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "Total Teachers", value: formatCount(stats?.totalTeachers), trend: "+34%", icon: Swords, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" },
    { label: "Monthly Revenue", value: stats?.mrrEstimate != null ? `₹${(stats.mrrEstimate / 100000).toFixed(1)}L` : stats?.platformMrr != null ? `₹${(stats.platformMrr / 100000).toFixed(1)}L` : "—", trend: "+22%", icon: DollarSign, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-foreground tracking-tight">Platform Analytics</h1>
          <p className="text-muted-foreground font-medium">Real-time ecosystem performance and health metrics.</p>
        </header>

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {topStats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card p-6 rounded-[32px] border border-border shadow-sm relative overflow-hidden group">
              <div className={`${s.bg} ${s.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <s.icon className="w-6 h-6" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-black text-foreground">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : String(s.value)}
                </h3>
                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center">
                  {s.trend} <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-card p-8 rounded-[32px] border border-border shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-foreground uppercase tracking-tight">Student Acquisition</h3>
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">Growth Curve</div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600 }} />
                <Tooltip contentStyle={{ borderRadius: "20px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} cursor={{ stroke: "#6366f1", strokeWidth: 2 }} />
                <Line type="monotone" dataKey="students" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: "#6366f1", strokeWidth: 3, stroke: "#fff" }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card p-8 rounded-[32px] border border-border shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-foreground uppercase tracking-tight">Revenue Stream</h3>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">Monthly MRR</div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600 }} />
                <Tooltip cursor={{ fill: "hsl(var(--secondary))" }} contentStyle={{ borderRadius: "20px", border: "none" }} />
                <Bar dataKey="revenue" fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-card p-8 rounded-[32px] border border-border shadow-sm flex flex-col items-center">
            <h3 className="font-black text-foreground uppercase tracking-tight mb-6 self-start w-full text-left">Market Share</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={planDistribution} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
              {planDistribution.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card p-8 rounded-[32px] border border-border shadow-sm">
            <h3 className="font-black text-foreground uppercase tracking-tight mb-8">Student Focus</h3>
            <div className="space-y-6">
              {[
                { label: "JEE Main/Adv", value: 62, color: "bg-indigo-500" },
                { label: "NEET UG", value: 34, color: "bg-emerald-500" },
                { label: "Foundation", value: 4, color: "bg-purple-500" },
              ].map((ex) => (
                <div key={ex.label}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-black text-foreground uppercase tracking-widest">{ex.label}</span>
                    <span className="text-sm font-black text-foreground">{ex.value}%</span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${ex.value}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${ex.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card p-8 rounded-[32px] border border-border shadow-sm">
            <h3 className="font-black text-foreground uppercase tracking-tight mb-6">System Integrity</h3>
            <div className="space-y-3">
              {[
                { label: "Global Uptime", value: "99.97%", icon: Globe, status: "text-emerald-500" },
                { label: "API Latency", value: "142ms", icon: Zap, status: "text-amber-500" },
                { label: "Security", value: "Shield Active", icon: ShieldCheck, status: "text-indigo-500" },
                { label: "Error Rate", value: "0.03%", icon: Activity, status: "text-emerald-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-secondary rounded-[20px] group hover:bg-card hover:shadow-md transition-all cursor-default">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                  </div>
                  <span className={`text-xs font-black ${item.status}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformStatsPage;
