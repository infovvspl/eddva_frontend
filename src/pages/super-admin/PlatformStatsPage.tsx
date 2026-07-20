import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Building2, DollarSign, Swords, Activity, Zap, Globe, ShieldCheck, ArrowUpRight, Loader2, Database, ChevronDown
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { usePlatformStats } from "@/hooks/use-stats";

// Dynamic data will be loaded from the API
const PlatformStatsPage = () => {
  const { data: stats, isLoading } = usePlatformStats();
  const [acqOpen, setAcqOpen] = useState(true);
  const [revOpen, setRevOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [integrityOpen, setIntegrityOpen] = useState(false);

  const userGrowthData = stats?.userGrowth || [];
  const instituteGrowthData = stats?.instituteGrowth || [];
  
  const total = stats?.totalTenants || 0;
  const active = stats?.activeTenants || 0;
  const trial = stats?.trialTenants || 0;
  const other = Math.max(0, total - active - trial);

  const realPlanDistribution = total > 0 ? [
    { name: "Active", value: active, color: "#818cf8" },
    { name: "Trial", value: trial, color: "#cbd5e1" },
    { name: "Other", value: other, color: "#0f172a" },
  ].filter(p => p.value > 0) : [];

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
    <div className="min-h-screen bg-white p-4 pb-28 md:p-6 md:pb-6 lg:p-10 font-sans text-slate-900">
      <div className="w-full">
        <header className="mb-7 md:mb-10 bg-slate-50/50 border border-slate-200 rounded-[28px] p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <h2 className="text-2xl sm:text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Ecosystem Intelligence</h2>
          <h1 className="text-xl sm:text-[34px] lg:text-[40px] font-bold text-slate-900 tracking-tight leading-tight">Platform Analytics</h1>
          <p className="text-slate-400 text-sm md:text-[15px] mt-1 font-semibold">Real-time architecture performance and platform health metrics</p>
        </header>

        {/* Top Stats */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-7 md:mb-10">
          {topStats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-5 md:p-7 rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className={`p-3 rounded-[16px] ${s.bg} ${s.color} w-fit mb-4 transition-transform group-hover:scale-110`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{s.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-xl md:text-[28px] font-bold text-slate-900">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : String(s.value)}
                </h3>
                <span className="text-[10px] font-medium text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  {s.trend} <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                </span>
              </div>
              <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-50/30 opacity-0 group-hover:opacity-100 blur-[40px] transition-opacity translate-x-12 -translate-y-12" />
            </motion.div>
          ))}
        </div>

        {/* Mobile View Accordions */}
        <div className="sm:hidden space-y-3 mb-6">
          {/* Student Acquisition (Accordion: Open by default, togglable) */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setAcqOpen(!acqOpen)}
              className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">Student Acquisition</h3>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${acqOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {acqOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-2">
                    <ResponsiveContainer width="100%" height={180}>
                      {userGrowthData.length > 0 ? (
                        <LineChart data={userGrowthData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 900 }} dy={5} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 900 }} />
                          <Tooltip contentStyle={{ borderRadius: "16px", border: "1px solid #f1f5f9", fontSize: 11 }} cursor={{ stroke: "#6366f1", strokeWidth: 1.5 }} />
                          <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: "#6366f1" }} />
                        </LineChart>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">Data not available</div>
                      )}
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Revenue Hub (Accordion: Closed by default, togglable) */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setRevOpen(!revOpen)}
              className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">Revenue Hub</h3>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${revOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {revOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-2">
                    <ResponsiveContainer width="100%" height={180}>
                      {instituteGrowthData.length > 0 ? (
                        <BarChart data={instituteGrowthData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 900 }} dy={5} />
                          <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => String(v)} tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 900 }} />
                          <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "16px", border: "1px solid #f1f5f9", fontSize: 11 }} />
                          <Bar dataKey="institutes" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={24} />
                        </BarChart>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">Data not available</div>
                      )}
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Market Share (Accordion: Closed by default, togglable) */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setShareOpen(!shareOpen)}
              className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">Market Share</h3>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${shareOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {shareOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-2 flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={160}>
                      {realPlanDistribution.length > 0 ? (
                        <PieChart>
                          <Pie data={realPlanDistribution} innerRadius={45} outerRadius={60} paddingAngle={8} dataKey="value">
                            {realPlanDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', fontSize: 11 }} />
                        </PieChart>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">Data not available</div>
                      )}
                    </ResponsiveContainer>
                    {realPlanDistribution.length > 0 && (
                      <div className="grid grid-cols-3 gap-x-4 gap-y-2 mt-4 w-full justify-items-center">
                        {realPlanDistribution.map((p) => (
                          <div key={p.name} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
                            <span className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Student Focus (Accordion: Closed by default, togglable) */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setFocusOpen(!focusOpen)}
              className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">Student Focus</h3>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${focusOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {focusOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-2 space-y-3">
                    {[
                      { label: "Active Students", value: stats?.studentFocus?.activeStudents ?? "N/A" },
                      { label: "New Enrollments", value: stats?.studentFocus?.newEnrollments ?? "N/A" },
                      { label: "Avg. Attendance", value: stats?.studentFocus?.averageAttendanceRate ?? "N/A" },
                      { label: "Course Completion", value: stats?.studentFocus?.courseCompletionRate ?? "N/A" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{item.label}</span>
                        <span className="text-xs font-bold text-slate-950">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* System Integrity (Accordion: Closed by default, togglable) */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setIntegrityOpen(!integrityOpen)}
              className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">System Integrity</h3>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${integrityOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {integrityOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-2 space-y-3">
                    {[
                      { label: "Storage Usage", value: stats?.storageUsage != null ? `${stats.storageUsage}GB` : "N/A", icon: Database, status: "text-emerald-500" },
                      { label: "AI Requests Today", value: stats?.aiRequestsToday != null ? String(stats.aiRequestsToday) : "0", icon: Zap, status: "text-amber-500" },
                      { label: "Security Alerts", value: stats?.securityAlerts != null ? String(stats.securityAlerts) : "0", icon: ShieldCheck, status: "text-indigo-500" },
                      { label: "System Health", value: stats?.systemHealth != null ? `${stats.systemHealth}%` : "100%", icon: Activity, status: "text-emerald-500" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{item.label}</span>
                        </div>
                        <span className={`text-xs font-bold ${item.status}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Charts - Desktop View */}
        <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          <div className="bg-white p-5 md:p-8 rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6 md:mb-8 relative z-10">
              <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">Student Acquisition</h3>
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-medium uppercase tracking-wider">Growth Curve</div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              {userGrowthData.length > 0 ? (
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 900 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 900 }} />
                  <Tooltip contentStyle={{ borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.05)" }} cursor={{ stroke: "#6366f1", strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={5} dot={{ r: 0 }} activeDot={{ r: 8, fill: "#6366f1" }} />
                </LineChart>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">Data not available</div>
              )}
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-5 md:p-8 rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6 md:mb-8 relative z-10">
              <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">Revenue Hub</h3>
              <div className="px-3 py-1 bg-white text-gray-900 rounded-full text-[10px] font-medium uppercase tracking-wider">MRR Protocol</div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              {instituteGrowthData.length > 0 ? (
                <BarChart data={instituteGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 900 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => String(v)} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 900 }} />
                  <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "24px", border: "1px solid #f1f5f9" }} />
                  <Bar dataKey="institutes" fill="#0f172a" radius={[12, 12, 0, 0]} barSize={44} />
                </BarChart>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">Data not available</div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Market Share - Desktop View */}
          <div className="hidden sm:flex bg-white p-5 md:p-8 rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm flex-col items-center">
            <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight mb-6 self-start w-full text-left">Market Share</h3>
            <ResponsiveContainer width="100%" height={240}>
              {realPlanDistribution.length > 0 ? (
                <PieChart>
                  <Pie data={realPlanDistribution} innerRadius={70} outerRadius={90} paddingAngle={10} dataKey="value">
                    {realPlanDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '20px' }} />
                </PieChart>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">Data not available</div>
              )}
            </ResponsiveContainer>
            {realPlanDistribution.length > 0 && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-8 w-full">
                {realPlanDistribution.map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.1em]">{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Focus - Desktop View */}
          <div className="hidden sm:block bg-white p-5 md:p-8 rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm">
            <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight mb-6">Student Focus</h3>
            <div className="space-y-4">
              {[
                { label: "Active Students", value: stats?.studentFocus?.activeStudents ?? "N/A" },
                { label: "New Enrollments", value: stats?.studentFocus?.newEnrollments ?? "N/A" },
                { label: "Avg. Attendance", value: stats?.studentFocus?.averageAttendanceRate ?? "N/A" },
                { label: "Course Completion", value: stats?.studentFocus?.courseCompletionRate ?? "N/A" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl group/item hover:bg-slate-100 transition-all cursor-default">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 group-hover/item:text-slate-700">{item.label}</span>
                  <span className="text-[13px] font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Integrity - Desktop View */}
          <div className="hidden sm:block bg-white p-5 md:p-8 rounded-[28px] md:rounded-[44px] text-gray-900 shadow-lg shadow-slate-900/40 relative overflow-hidden group border border-slate-100">
            <h3 className="text-base md:text-lg font-bold mb-6 relative z-10 text-slate-900">System Integrity</h3>
            <div className="space-y-4 relative z-10">
              {[
                { label: "Storage Usage", value: stats?.storageUsage != null ? `${stats.storageUsage}GB` : "N/A", icon: Database, status: "text-emerald-500" },
                { label: "AI Requests Today", value: stats?.aiRequestsToday != null ? String(stats.aiRequestsToday) : "0", icon: Zap, status: "text-amber-500" },
                { label: "Security Alerts", value: stats?.securityAlerts != null ? String(stats.securityAlerts) : "0", icon: ShieldCheck, status: "text-indigo-500" },
                { label: "System Health", value: stats?.systemHealth != null ? `${stats.systemHealth}%` : "100%", icon: Activity, status: "text-emerald-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl group/item hover:bg-slate-100 transition-all cursor-default">
                  <div className="flex items-center gap-4">
                    <item.icon className="w-5 h-5 text-slate-400 group-hover/item:text-indigo-500 transition-colors" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 group-hover/item:text-slate-700">{item.label}</span>
                  </div>
                  <span className={`text-[13px] font-bold ${item.status}`}>{item.value}</span>
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
