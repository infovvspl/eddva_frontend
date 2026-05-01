import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell, LineChart, Line, PieChart, Pie, Legend,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, Target, Zap, BarChart3, PieChart as PieIcon, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Reusable tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit = "" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 shadow-2xl text-xs">
      <p className="font-black text-slate-300 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-bold" style={{ color: p.color || "#60A5FA" }}>
          {p.name}: <span className="text-white">{p.value?.toLocaleString()}{unit || (p.name === "rank" ? "" : " XP")}</span>
        </p>
      ))}
    </div>
  );
};

// ── Chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, icon, subtitle, children, className }: {
  title: string; icon: React.ReactNode; subtitle?: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-lg", className)}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-600">{icon}</span>
            <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{title}</h3>
          </div>
          {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

// ── 1. Weekly XP Earned ───────────────────────────────────────────────────────
export function WeeklyXPChart({ data }: { data?: any[] }) {
  return (
    <ChartCard title="Weekly XP Earned" icon={<Zap className="w-4 h-4" />} subtitle="This week's grind">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 700 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="xp" name="xp" stroke="#2563EB" strokeWidth={2.5}
            fill="url(#xpGrad)" dot={{ fill: "#2563EB", r: 4, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, fill: "#2563EB" }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 2. Rank Movement ──────────────────────────────────────────────────────────
export function RankTrajectoryChart({ data }: { data?: any[] }) {
  return (
    <ChartCard title="Rank Trajectory" icon={<TrendingUp className="w-4 h-4" />} subtitle="8-week journey">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis reversed tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 700 }} axisLine={false} tickLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip content={<CustomTooltip unit="" />} />
          <Line type="monotone" dataKey="rank" name="rank" stroke="#7C3AED" strokeWidth={2.5}
            dot={{ fill: "#7C3AED", r: 5, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 7 }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 text-center">
        ↑ Lower number = better rank
      </p>
    </ChartCard>
  );
}

// ── 3. Subject Performance Radar ──────────────────────────────────────────────
export function SubjectRadarChart({ data }: { data?: any[] }) {
  return (
    <ChartCard title="Subject Accuracy" icon={<Target className="w-4 h-4" />} subtitle="Across all subjects">
      <ResponsiveContainer width="100%" height={230}>
        <RadarChart data={data ?? []} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#64748B", fontWeight: 700 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#CBD5E1" }} />
          <Radar name="Accuracy" dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} strokeWidth={2} />
          <Tooltip content={<CustomTooltip unit="%" />} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 4. Tier Distribution ──────────────────────────────────────────────────────
export function TierDistributionChart({ data }: { data?: any[] }) {
  const safeData = data ?? [];
  return (
    <ChartCard title="Tier Distribution" icon={<PieIcon className="w-4 h-4" />} subtitle="All students in leaderboard">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={safeData} dataKey="value" nameKey="name" cx="50%" cy="50%"
            innerRadius={55} outerRadius={85} paddingAngle={3}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {safeData.map((entry: any) => (
              <Cell key={entry.name} fill={entry.color} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ borderRadius: 16, border: "none", background: "#0F172A", color: "#fff" }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 5. XP by Subject Bar ─────────────────────────────────────────────────────
export function SubjectXPChart({ data }: { data?: any[] }) {
  const BAR_COLORS = ["#2563EB", "#7C3AED", "#06B6D4", "#F59E0B"];
  const safeData = data ?? [];
  return (
    <ChartCard title="XP by Subject" icon={<BarChart3 className="w-4 h-4" />} subtitle="Total XP earned per subject">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={safeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 700 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="xp" name="xp" radius={[10, 10, 0, 0]}>
            {safeData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 6. Activity Heatmap (simplified) ─────────────────────────────────────────

const HEAT_COLORS = ["#F1F5F9", "#BFDBFE", "#60A5FA", "#2563EB", "#1E3A8A"];

export function ActivityHeatmap({ data }: { data?: any[] }) {
  return (
    <ChartCard title="Activity Heatmap" icon={<Activity className="w-4 h-4" />} subtitle="Last 5 weeks">
      <div className="grid grid-cols-7 gap-1.5">
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <p key={i} className="text-[9px] font-black text-slate-300 uppercase text-center">{d}</p>
        ))}
        {(data ?? []).map((cell: any) => (
          <div
            key={cell.day}
            title={`${cell.value * 100} XP`}
            style={{ backgroundColor: HEAT_COLORS[cell.value] }}
            className="aspect-square rounded-md transition-transform hover:scale-110 cursor-pointer"
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="text-[9px] font-black text-slate-300 uppercase">Less</span>
        {HEAT_COLORS.map((c, i) => <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />)}
        <span className="text-[9px] font-black text-slate-300 uppercase">More</span>
      </div>
    </ChartCard>
  );
}
