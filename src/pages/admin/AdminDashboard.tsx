import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight, Sparkles, Radio, Plus, ArrowRight, Calendar,
  Video, HelpCircle
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, LineChart, Line
} from 'recharts';
import { useAuthStore } from "@/lib/auth-store";
import { useAdminDashboard, useBatches } from "@/hooks/use-admin";
import { useAdminPresenceStats } from "@/hooks/use-presence";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StarBorder from "@/components/ui/star-border";

// ─── Constants & Styles ──────────────────────────────────────────────────────

const EMERALD = "#10B981";
const AMBER = "#F59E0B";
const BLUE_SHADES = ["#1D4ED8", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];

const EXAM_STYLES: Record<string, { from: string; to: string; badge: string }> = {
  jee: { from: "#1D4ED8", to: "#4F46E5", badge: "JEE" },
  neet: { from: "#059669", to: "#0D9488", badge: "NEET" },
  both: { from: "#7C3AED", to: "#C026D3", badge: "ALL" },
  default: { from: "#0F172A", to: "#334155", badge: "—" },
};

// ─── Components ──────────────────────────────────────────────────────────────

const GLOW_HEX: Record<string, [string, string]> = {
  "bg-blue-600": ["#2563EB", "#60A5FA"],
  "bg-emerald-500": ["#10B981", "#6EE7B7"],
  "bg-rose-400": ["#FB7185", "#FDA4AF"],
  "bg-indigo-500": ["#6366F1", "#A5B4FC"],
  "bg-indigo-600": ["#4F46E5", "#818CF8"],
  "bg-orange-500": ["#F97316", "#FDBA74"],
};

function GlassCard({ children, className = "", delay = 0, accentColor }: {
  children: React.ReactNode; className?: string; delay?: number; accentColor?: string;
}) {
  const [glowHead, glowTrail] = GLOW_HEX[accentColor ?? ""] ?? ["#2563EB", "#60A5FA"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="h-full"
    >
      <StarBorder
        as="div"
        theme="light"
        color={glowHead}
        trailColor={glowTrail}
        loop={false}
        lapDuration={3.5}
        duration={3}
        thickness={1.5}
        radius={32}
        trailLength={0.12}
        glow={0.7}
        hover="lap"
        clickPulse={false}
        backgroundColor="hsl(var(--card))"
        textColor="hsl(var(--foreground))"
        className={cn(
          "flex! w-full flex-col items-stretch! justify-between! gap-0! p-0! text-left font-normal",
          "relative overflow-hidden rounded-[2rem] shadow-xl shadow-slate-300/20 backdrop-blur-2xl sm:backdrop-blur-none h-full",
          className
        )}
      >
        {accentColor && (
          <div className={cn("hidden sm:block absolute top-0 left-0 right-0 h-1.5 z-20", accentColor)} />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none sm:hidden" />
        <div className="relative z-10 h-full flex flex-col">{children}</div>
      </StarBorder>
    </motion.div>
  );
}

function CourseThumbnail({ name, examTarget, imageUrl, className = "" }: { name: string; examTarget: string; imageUrl?: string; className?: string }) {
  const [imgError, setImgError] = React.useState(false);
  const style = EXAM_STYLES[examTarget?.toLowerCase()] ?? EXAM_STYLES.default;
  const initials = name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
  
  return (
    <div className={cn("rounded-xl overflow-hidden shrink-0 relative", className)} style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}>
      {imageUrl && !imgError ? (
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
           <span className="text-white font-semibold text-xs leading-none">{initials}</span>
        </div>
      )}
    </div>
  );
}

// ─── Pulse Cards (separate colored card per metric) ────────────────────────────

function RingStat({ percent, color, size = 56, children }: { percent: number; color: string; size?: number; children?: React.ReactNode }) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="relative shrink-0 rounded-full flex items-center justify-center"
      style={{ width: size, height: size, background: `conic-gradient(${color} ${pct * 3.6}deg, #e2e8f0 0deg)` }}
    >
      <div className="absolute rounded-full bg-white flex items-center justify-center" style={{ inset: 4 }}>
        {children}
      </div>
    </div>
  );
}

const PULSE_THEMES = {
  indigo: { label: "text-indigo-600", ring: "#4F46E5", trail: "#A5B4FC", bgFrom: "rgba(238,242,255,0.75)", bgTo: "rgba(238,242,255,0.15)", blob: "bg-indigo-200/40" },
  emerald: { label: "text-emerald-600", ring: "#10B981", trail: "#6EE7B7", bgFrom: "rgba(236,253,245,0.8)", bgTo: "rgba(236,253,245,0.15)", blob: "bg-emerald-200/40" },
  violet: { label: "text-violet-600", ring: "#7C3AED", trail: "#C4B5FD", bgFrom: "rgba(245,243,255,0.8)", bgTo: "rgba(245,243,255,0.15)", blob: "bg-violet-200/40" },
  amber: { label: "text-amber-700", ring: "#F59E0B", trail: "#FCD34D", bgFrom: "rgba(255,251,235,0.85)", bgTo: "rgba(255,251,235,0.15)", blob: "bg-amber-200/40" },
} as const;

function PulseCard({ theme, label, children, index = 0 }: { theme: keyof typeof PULSE_THEMES; label: string; children: React.ReactNode; index?: number }) {
  const t = PULSE_THEMES[theme];
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07, duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }} className="h-full">
      <StarBorder
        as="div"
        theme="light"
        color={t.ring}
        trailColor={t.trail}
        loop={false}
        lapDuration={3.5}
        duration={3}
        thickness={1.5}
        radius={24}
        trailLength={0.12}
        glow={0.7}
        hover="lap"
        clickPulse={false}
        backgroundColor={`linear-gradient(135deg, ${t.bgFrom}, ${t.bgTo})`}
        textColor="hsl(var(--foreground))"
        className="flex! w-full flex-col items-stretch! justify-between! gap-0! p-4! sm:p-5! text-left font-normal shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-full"
      >
        <div className={cn("absolute -right-6 -top-6 w-20 h-20 rounded-full pointer-events-none", t.blob)} />
        <p className={cn("relative text-xs font-black uppercase tracking-widest mb-3", t.label)}>{label}</p>
        <div className="relative">{children}</div>
      </StarBorder>
    </motion.div>
  );
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data, isLoading } = useAdminDashboard();
  const { data: batchesRaw } = useBatches();
  const { data: presence } = useAdminPresenceStats();

  if (isLoading || !data) {
    return (
      <div className="w-full space-y-7 sm:space-y-8">
        {/* Hero banner skeleton */}
        <div className="relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8 lg:p-9 shadow-xl border border-blue-600/10 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700">
          <Skeleton className="h-8 w-52 mb-2 bg-white/40 dark:bg-slate-700" />
          <Skeleton className="h-4 w-72 mb-8 bg-white/30 dark:bg-slate-700" />
          <div className="flex gap-3 flex-wrap">
            <Skeleton className="h-10 w-40 rounded-full bg-white/20 dark:bg-slate-700" />
            <Skeleton className="h-10 w-32 rounded-2xl bg-white/20 dark:bg-slate-700" />
          </div>
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 px-6 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-52" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ))}
        </div>

        {/* Recent items skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, j) => (
            <div key={j} className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
              <Skeleton className="h-5 w-32 mb-4" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { stats, recentDoubts = [], recentBatches = [] } = data;
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  // ─── Real Data for Analytics ───
  const enrollmentData = recentBatches.map(b => ({
    name: b.name.split(" ")[0],
    students: b.studentCount,
  }));
  const enrollmentTotal = enrollmentData.reduce((sum, b) => sum + (b.students || 0), 0) || 1;
  const enrollmentWithShare = enrollmentData.map((b, i) => ({
    ...b,
    share: Math.round((b.students / enrollmentTotal) * 100),
    color: BLUE_SHADES[i % BLUE_SHADES.length],
  }));

  const teacherData = [
    { name: 'Active', value: stats.activeTeachers, color: EMERALD },
    { name: 'Pending', value: stats.pendingTeachers, color: AMBER },
  ];
  const teacherTotal = teacherData.reduce((sum, t) => sum + (t.value || 0), 0) || 1;

  const capacityTrend = recentBatches.map(b => ({
    name: b.name.split(" ")[0],
    enrolled: b.studentCount,
    capacity: b.maxStudents,
  }));

  const adoptionPct = stats.totalBatches > 0 ? Math.round((stats.activeBatches / stats.totalBatches) * 100) : 0;
  const teacherPct = Math.round((stats.activeTeachers / teacherTotal) * 100);
  const doubtsByBatch = Object.values(
    recentDoubts.reduce((acc, d) => {
      const key = d.batchName || "Unassigned";
      acc[key] = acc[key] || { name: key, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { name: string; count: number }>)
  ).sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <div className="w-full space-y-7 sm:space-y-8 font-semibold">
      
      {/* ─── Header Section ─── */}
      <section
        className="flex flex-col relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8 lg:p-9 text-white shadow-lg border border-white/5 mb-8"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1e3a5f 100%)' }}
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay"></div>
        {/* Mesh Gradients & Glow Effects */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/20 via-transparent to-slate-900/20 pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-72 h-72 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 bottom-0 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

        {/* Flowing wave shape */}
        <svg className="absolute bottom-0 left-0 right-0 w-full h-24 opacity-10 pointer-events-none select-none z-0" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C300,100 600,20 900,80 C1050,110 1150,90 1200,60 L1200,120 L0,120 Z" fill="white" />
        </svg>

        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative z-10 flex flex-col justify-between py-1 flex-1 min-w-0 w-full">
          <div className="flex flex-col items-start gap-1.5 min-w-0 w-full">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[2rem] font-semibold text-white tracking-tight leading-snug break-words">
              Welcome, {user?.name}
            </h1>
            <p className="text-sm sm:text-base font-semibold text-blue-100/80 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-200/60" /> {today} <span className="hidden sm:inline text-blue-300/60">•</span> <span className="hidden sm:inline text-white font-semibold">{user?.tenantName}</span>
            </p>
          </div>
          
          <div className="mt-6 sm:mt-8 flex flex-row items-center gap-3 sm:gap-5 flex-wrap">
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-md font-semibold text-[10px] sm:text-xs tracking-wider uppercase gap-1.5 rounded-full">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-200 shrink-0" />
              Real-time Analytics
            </Badge>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex items-center gap-2 sm:gap-3"
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-3 w-11 h-11 sm:w-auto sm:h-auto sm:px-5 sm:py-3.5 rounded-full sm:rounded-2xl bg-white/10 border border-white/20 shadow-sm backdrop-blur-md shrink-0">
                <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <div className="hidden sm:block">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/70 leading-none">Online Students</p>
                  <p className="text-xl font-semibold text-white leading-none mt-1.5">{presence?.studentsOnline ?? 0}</p>
                </div>
                <span className="sm:hidden text-xs font-semibold text-white">{presence?.studentsOnline ?? 0}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-3 w-11 h-11 sm:w-auto sm:h-auto sm:px-5 sm:py-3.5 rounded-full sm:rounded-2xl bg-white/10 border border-white/20 text-white shadow-sm backdrop-blur-md shrink-0">
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-blue-200" />
                <div className="hidden sm:block">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/70 leading-none">Live Classes</p>
                  <p className="text-xl font-semibold leading-none mt-1.5">{presence?.liveClassesRunning ?? 0}</p>
                </div>
                <span className="sm:hidden text-xs font-semibold text-white">{presence?.liveClassesRunning ?? 0}</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── Top Stats ─── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Adoption */}
        <PulseCard theme="indigo" label="Adoption" index={0}>
          <div className="flex items-center gap-3">
            <RingStat percent={adoptionPct} color={PULSE_THEMES.indigo.ring} size={56}>
              <span className="text-sm font-black text-slate-900">{adoptionPct}%</span>
            </RingStat>
            <div className="min-w-0">
              <p className="text-2xl font-black text-slate-900 leading-none">{stats.activeBatches}<span className="text-sm font-bold text-slate-400"> / {stats.totalBatches}</span></p>
              <p className="text-xs font-semibold text-slate-500 mt-1.5 leading-snug">batches active now</p>
            </div>
          </div>
        </PulseCard>

        {/* Engagement */}
        <PulseCard theme="emerald" label="Engagement" index={1}>
          <div className="flex items-center gap-3">
            <RingStat percent={teacherPct} color={PULSE_THEMES.emerald.ring} size={56}>
              <span className="text-sm font-black text-slate-900">{teacherPct}%</span>
            </RingStat>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-500 leading-snug mb-2">of teaching staff active</p>
              <div className="space-y-1.5">
                {teacherData.map((t) => (
                  <div key={t.name} className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-slate-500">{t.name}</span>
                    <span className="text-slate-900 ml-auto">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PulseCard>

        {/* Content delivered */}
        <PulseCard theme="violet" label="Content" index={2}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <Video className="w-6 h-6 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-slate-900 leading-none">{stats.totalLectures}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1.5 leading-snug">lectures · {stats.totalTestSessions} tests held</p>
            </div>
          </div>
        </PulseCard>

        {/* Need attention */}
        <PulseCard theme="amber" label="Need Attention" index={3}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <HelpCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-black text-slate-900 leading-none">{stats.openDoubts}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1.5 mb-2 leading-snug">doubts awaiting a reply</p>
              {doubtsByBatch.length > 0 && (
                <div className="space-y-1.5">
                  {doubtsByBatch.map((b) => (
                    <div key={b.name} className="flex items-center gap-1.5 text-xs font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-slate-500 truncate">{b.name}</span>
                      <span className="text-slate-900 ml-auto shrink-0">{b.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PulseCard>
      </section>

      {/* ─── Analytics Section ─── */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Batch Distribution Chart */}
        <GlassCard accentColor="bg-blue-600" delay={0.4}>
          <CardHeader className="p-5 sm:p-8 pb-3 sm:pb-4 flex flex-row items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Statistics</p>
              <CardTitle className="text-lg font-semibold text-slate-900 mt-0.5">Batch Enrollment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-8 pt-0">
            <div className="flex flex-col gap-6">
              <div className="h-[180px] sm:h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrollmentWithShare}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} dx={-10} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc', opacity: 0.5 }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xl p-4 rounded-2xl font-semibold">
                              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                              <p className="text-lg font-semibold text-slate-900">
                                {payload[0].value} <span className="text-sm text-slate-500 font-semibold">Students</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="students" radius={[8, 8, 0, 0]}>
                      {enrollmentWithShare.map((entry, i) => (
                        <Cell key={`bar-${i}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {enrollmentWithShare.length > 0 && (
                <div className="flex flex-row flex-wrap gap-x-4 gap-y-2">
                  {enrollmentWithShare.map((b) => (
                    <div key={b.name} className="flex items-center gap-2 text-xs font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                      <span className="text-slate-900">{b.share}%</span>
                      <span className="text-slate-400 truncate">{b.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </GlassCard>

        {/* Teacher Status Chart */}
        <GlassCard accentColor="bg-emerald-500" delay={0.5}>
          <CardHeader className="p-5 sm:p-8 pb-3 sm:pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Statistics</p>
            <CardTitle className="text-lg font-semibold text-slate-900 mt-0.5">Teacher Network</CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-8 pt-0">
            <div className="flex items-center gap-5">
              <div className="h-[110px] w-[110px] sm:h-[130px] sm:w-[130px] shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={teacherData}
                      cx="50%"
                      cy="50%"
                      innerRadius="72%"
                      outerRadius="100%"
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {teacherData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-xl font-semibold text-slate-900 leading-none">{stats.totalTeachers}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mt-1">Teachers</p>
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-3.5">
                {teacherData.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-500 truncate">{item.name}</span>
                      </div>
                      <span className="text-slate-900 shrink-0 ml-2">{item.value}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.round((item.value / teacherTotal) * 100)}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </GlassCard>

        {/* Enrollment vs Capacity Trend */}
        {capacityTrend.length > 0 && (
          <GlassCard accentColor="bg-rose-400" delay={0.55}>
            <CardHeader className="p-5 sm:p-8 pb-3 sm:pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Statistics</p>
                  <CardTitle className="text-lg font-semibold text-slate-900 mt-0.5">Enrollment vs Capacity</CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold mt-2">
                <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Enrolled</span>
                <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Capacity</span>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-8 pt-0">
              <div className="h-[180px] sm:h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={capacityTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} dx={-10} />
                    <Tooltip
                      cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xl p-4 rounded-2xl font-semibold space-y-1">
                              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                              {payload.map((p) => (
                                <p key={p.dataKey as string} className="text-sm font-semibold text-slate-900">
                                  {p.value} <span className="text-xs text-slate-500 font-semibold capitalize">{p.dataKey as string}</span>
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="enrolled" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3, fill: "#2563EB" }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="capacity" stroke="#FB7185" strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 3, fill: "#FB7185" }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </GlassCard>
        )}
      </section>

      {/* ─── Bottom Grid ─── */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Course Directory (8/12) */}
        <div className="xl:col-span-8">
          <GlassCard accentColor="bg-indigo-600">
            <CardHeader className="p-5 sm:p-8 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Batches</CardTitle>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/admin/batches?new=true")}
                className="flex px-3 py-1.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl bg-slate-900 text-white text-[9px] sm:text-[11px] font-semibold uppercase tracking-widest items-center gap-1.5 sm:gap-2 shadow-xl shrink-0"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">New Batch</span><span className="sm:hidden">New</span>
              </motion.button>
            </CardHeader>

            <CardContent className="p-5 sm:p-8 pt-0">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-6">
                {recentBatches.slice(0, 4).map((course, i) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + (i * 0.05) }}
                    onClick={() => navigate(`/admin/batches/${course.id}`)}
                    className="group relative flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-1.5 sm:gap-5 p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-2xl transition-all cursor-pointer text-center sm:text-left lg:border-slate-200 lg:bg-slate-50/40 lg:hover:bg-white lg:hover:border-blue-400 lg:shadow-xs lg:hover:shadow-xl"
                  >
                    <CourseThumbnail name={course.name} examTarget={course.examTarget} imageUrl={course.thumbnailUrl} className="w-10 h-10 sm:w-14 sm:h-14 mb-1 sm:mb-0" />
                    <div className="flex-1 min-w-0 w-full px-1">
                      <h4 className="text-xs sm:text-base font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{course.name}</h4>
                      <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5 sm:mt-1 truncate">{course.examTarget} · {course.studentCount} Students</p>
                    </div>
                    <ArrowRight className="sm:hidden absolute bottom-2 right-2 w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    <ChevronRight className="hidden sm:block w-5 h-5 shrink-0 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </div>

        {/* Doubts (4/12) */}
        <div className="xl:col-span-4">
          <GlassCard accentColor="bg-orange-500">
            <CardHeader className="p-5 sm:p-8 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">Urgent Doubts</CardTitle>
              <button onClick={() => navigate("/teacher/doubts")} className="text-[10px] font-semibold uppercase tracking-widest text-blue-600">View All</button>
            </CardHeader>
            
            <CardContent className="p-5 sm:p-8 pt-0">
              <div className="space-y-4">
                {recentDoubts.slice(0, 4).map((d, i) => (
                  <div 
                    key={d.id} 
                    onClick={() => navigate("/teacher/doubts")}
                    className={cn(
                      "p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group lg:border-slate-200 lg:bg-slate-50/40 lg:hover:bg-white lg:hover:border-orange-300 lg:hover:shadow-md",
                      i === 3 && "hidden sm:block"
                    )}
                  >
                    <p className="text-[15px] sm:text-sm font-semibold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                      {d.questionText || d.topicName || "New Doubt Received"}
                    </p>
                    <div className="flex items-center justify-between mt-3.5 sm:mt-3">
                       <span className="text-[11px] sm:text-[10px] font-semibold text-slate-500 truncate max-w-[120px]">{d.studentName}</span>
                       <Badge variant="secondary" className="text-[9px] sm:text-[8px] font-semibold uppercase tracking-wider text-orange-600 bg-orange-50 hover:bg-orange-100 border-none px-2.5 py-0.5 rounded-full">
                         {d.status}
                       </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
