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
  { name: "Starter Tier", value: 14, color: "#cbd5e1" },
  { name: "Growth Hub", value: 18, color: "#818cf8" },
  { name: "Scale Dynamic", value: 12, color: "#6366f1" },
  { name: "Enterprise", value: 4, color: "#0f172a" },
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
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-7 md:mb-10 border-b border-slate-100 pb-6 md:pb-8">
          <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-2">Ecosystem Intelligence</h2>
          <h1 className="text-[26px] md:text-[34px] lg:text-[40px] font-black text-slate-900 tracking-tight leading-tight">Platform Analytics</h1>
          <p className="text-slate-400 text-sm md:text-[15px] mt-1 font-semibold">Real-time architecture performance and platform health metrics</p>
        </header>

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-7 md:mb-10">
          {topStats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-5 md:p-7 rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className={`p-3 rounded-[16px] ${s.bg} ${s.color} w-fit mb-4 transition-transform group-hover:scale-110`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-xl md:text-[28px] font-black text-slate-900">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : String(s.value)}
                </h3>
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  {s.trend} <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                </span>
              </div>
              <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-50/30 opacity-0 group-hover:opacity-100 blur-[40px] transition-opacity translate-x-12 -translate-y-12" />
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          <div className="bg-white p-5 md:p-8 rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6 md:mb-8 relative z-10">
              <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight">Student Acquisition</h3>
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-[0.15em]">Growth Curve</div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 900 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 900 }} />
                <Tooltip contentStyle={{ borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.05)" }} cursor={{ stroke: "#6366f1", strokeWidth: 2 }} />
                <Line type="monotone" dataKey="students" stroke="#6366f1" strokeWidth={5} dot={{ r: 0 }} activeDot={{ r: 8, fill: "#6366f1" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-5 md:p-8 rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6 md:mb-8 relative z-10">
              <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight">Revenue Hub</h3>
              <div className="px-3 py-1 bg-white text-gray-900 rounded-full text-[10px] font-black uppercase tracking-[0.15em]">MRR Protocol</div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 900 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 900 }} />
                <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "24px", border: "1px solid #f1f5f9" }} />
                <Bar dataKey="revenue" fill="#0f172a" radius={[12, 12, 0, 0]} barSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="bg-white p-5 md:p-8 rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm flex flex-col items-center">
            <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight mb-6 self-start w-full text-left">Market Share</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={planDistribution} innerRadius={70} outerRadius={90} paddingAngle={10} dataKey="value">
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-8 w-full">
              {planDistribution.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 md:p-8 rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm">
            <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight mb-6">Student Focus</h3>
            <div className="space-y-8">
              {[
                { label: "JEE Main/Adv", value: 62, color: "bg-indigo-600" },
                { label: "NEET UG Hub", value: 34, color: "bg-purple-600" },
                { label: "Foundation", value: 4, color: "bg-white" },
              ].map((ex) => (
                <div key={ex.label}>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{ex.label}</span>
                    <span className="text-[15px] font-black text-slate-900">{ex.value}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${ex.value}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${ex.color} shadow-sm`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 md:p-8 rounded-[28px] md:rounded-[44px] text-gray-900 shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
            <h3 className="text-base md:text-lg font-black mb-6 relative z-10">System Integrity</h3>
            <div className="space-y-4 relative z-10">
              {[
                { label: "Global Uptime", value: "99.99%", icon: Globe, status: "text-emerald-400" },
                { label: "API Latency", value: "112ms", icon: Zap, status: "text-amber-400" },
                { label: "Neural Layer", value: "Shield Active", icon: ShieldCheck, status: "text-indigo-400" },
                { label: "Error Margin", value: "0.01%", icon: Activity, status: "text-emerald-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-5 bg-white/5 border border-gray-200 rounded-[24px] group/item hover:bg-white/10 transition-all cursor-default">
                  <div className="flex items-center gap-4">
                    <item.icon className="w-5 h-5 text-white/20 group-hover/item:text-indigo-400 transition-colors" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">{item.label}</span>
                  </div>
                  <span className={`text-[13px] font-black ${item.status}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500 opacity-10 blur-[60px] translate-x-12 -translate-y-12" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformStatsPage;
