import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, BookOpen, HelpCircle, Loader2, ChevronRight,
  Video, Sparkles, Radio, Plus, BarChart2, TrendingUp,
  Activity, GraduationCap, Target, Calendar,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { useAuthStore } from "@/lib/auth-store";
import { useAdminDashboard, useBatches } from "@/hooks/use-admin";
import { useAdminPresenceStats } from "@/hooks/use-presence";
import { cn } from "@/lib/utils";

// ─── Constants & Styles ──────────────────────────────────────────────────────

const INDIGO = "#6366F1";
const PURPLE = "#A855F7";
const EMERALD = "#10B981";
const AMBER = "#F59E0B";
const BLUE = "#3B82F6";

const EXAM_STYLES: Record<string, { from: string; to: string; badge: string }> = {
  jee: { from: "#1D4ED8", to: "#4F46E5", badge: "JEE" },
  neet: { from: "#059669", to: "#0D9488", badge: "NEET" },
  both: { from: "#7C3AED", to: "#C026D3", badge: "ALL" },
  default: { from: "#0F172A", to: "#334155", badge: "—" },
};

// ─── Components ──────────────────────────────────────────────────────────────

function GlassCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 backdrop-blur-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)]",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

function StatCard({ label, value, icon: Icon, color, delay = 0, onClick }: {
  label: string; value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string; delay?: number; onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center sm:items-start p-0 sm:p-5 rounded-none sm:rounded-2xl border-none sm:border border-slate-100 bg-transparent sm:bg-white shadow-none sm:shadow-sm sm:hover:shadow-lg transition-all duration-300 w-[72px] sm:w-auto shrink-0",
        onClick && "cursor-pointer sm:hover:-translate-y-1"
      )}
    >
      <div className={cn("w-14 h-14 sm:w-10 sm:h-10 rounded-full sm:rounded-xl flex flex-col items-center justify-center mb-1.5 sm:mb-4 transition-transform group-hover:scale-110 duration-300 shadow-md sm:shadow-none relative", color)}>
        <Icon className="w-5 h-5 text-white hidden sm:block" />
        <div className="sm:hidden flex flex-col items-center justify-center w-full h-full">
          <Icon className="w-3.5 h-3.5 text-white/70 mb-0.5" />
          <span className="text-white font-black text-[11px] leading-none px-1 text-center truncate w-full">{value}</span>
        </div>
      </div>
      <div className="text-center sm:text-left w-full">
        <h4 className="hidden sm:block text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{value}</h4>
        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-600 sm:text-slate-400 mt-0 sm:mt-1 leading-tight sm:leading-normal">{label}</p>
      </div>
      {onClick && <ChevronRight className="hidden sm:block absolute top-4 right-4 w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />}
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
           <span className="text-white font-black text-xs leading-none">{initials}</span>
        </div>
      )}
    </div>
  );
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data, isLoading } = useAdminDashboard();
  const { data: batchesRaw } = useBatches();
  const { data: presence } = useAdminPresenceStats();

  const courses = Array.isArray(batchesRaw) ? batchesRaw : [];

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-blue-50 border-t-blue-600 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Intelligence...</p>
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

  const teacherData = [
    { name: 'Active', value: stats.activeTeachers, color: EMERALD },
    { name: 'Pending', value: stats.pendingTeachers, color: AMBER },
  ];

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-7 sm:space-y-8 pb-32">
      
      {/* ─── Header Section ─── */}
      <section 
        className="flex flex-col relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8 lg:p-9 text-white shadow-xl border border-blue-600/10 mb-8"
        style={{ background: 'linear-gradient(135deg, #172554 0%, #1E3A8A 50%, #2563EB 100%)' }}
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay"></div>
        {/* Mesh Gradients & Glow Effects */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/20 via-transparent to-indigo-900/30 pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 bottom-0 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        {/* Flowing wave shape */}
        <svg className="absolute bottom-0 left-0 right-0 w-full h-24 opacity-10 pointer-events-none select-none z-0" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C300,100 600,20 900,80 C1050,110 1150,90 1200,60 L1200,120 L0,120 Z" fill="white" />
        </svg>

        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative z-10 flex flex-col justify-between py-1 flex-1 min-w-0 w-full">
          <div className="flex flex-col items-start gap-1.5 min-w-0 w-full">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[2rem] font-black text-white tracking-tight leading-snug break-words">
              Welcome, {user?.name || user?.fullName}
            </h1>
            <p className="text-base font-semibold text-blue-100/80 mt-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-200/60" /> {today} <span className="text-blue-300/60">•</span> <span className="text-white font-bold">{user?.tenantName}</span>
            </p>
          </div>
          
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 flex-wrap">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 sm:px-5 sm:py-2.5 backdrop-blur-md shadow-sm self-start sm:self-auto">
              <Sparkles className="h-4 w-4 text-blue-200 shrink-0" />
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-white">Real-time Analytics</span>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto"
            >
              <div className="flex-1 sm:flex-none flex items-center gap-2 sm:gap-3 px-2.5 py-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 shadow-sm min-h-[44px] sm:min-h-[52px] backdrop-blur-md">
                <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <div>
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-blue-100/70 leading-none">Online Students</p>
                  <p className="text-base sm:text-xl font-black text-white leading-none mt-1 sm:mt-1.5">{presence?.studentsOnline ?? 0}</p>
                </div>
              </div>
              <div className="flex-1 sm:flex-none flex items-center gap-2 sm:gap-3 px-2.5 py-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-blue-600/80 border border-blue-400/30 text-white shadow-xl shadow-blue-900/50 min-h-[44px] sm:min-h-[52px] backdrop-blur-md">
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-blue-200" />
                <div>
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-blue-100/70 leading-none">Live Classes</p>
                  <p className="text-base sm:text-xl font-black leading-none mt-1 sm:mt-1.5">{presence?.liveClassesRunning ?? 0}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── Top Stats ─── */}
      <section className="flex sm:grid overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 pb-1.5 sm:pb-0 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats.totalStudents} icon={Users} color="bg-blue-600" delay={0} onClick={() => navigate("/admin/students")} />
        <StatCard label="Active Batches" value={`${stats.activeBatches}/${stats.totalBatches}`} icon={BookOpen} color="bg-indigo-600" delay={0.1} onClick={() => navigate("/admin/batches")} />
        <StatCard label="Total Lectures" value={stats.totalLectures} icon={Video} color="bg-purple-600" delay={0.2} onClick={() => navigate("/teacher/recorded-lectures")} />
        <StatCard label="Open Doubts" value={stats.openDoubts} icon={HelpCircle} color={stats.openDoubts > 0 ? "bg-orange-500" : "bg-emerald-500"} delay={0.3} onClick={() => navigate("/teacher/doubts")} />
      </section>

      {/* ─── Analytics Section ─── */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Batch Distribution Chart */}
        <GlassCard className="xl:col-span-2 p-5 sm:p-8" delay={0.4}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900">Batch Enrollment</h3>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Real-time student distribution</span>
          </div>
          
          <div className="h-[180px] sm:h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 800 }}
                  itemStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="students" fill={BLUE} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Teacher Status Chart */}
        <GlassCard className="p-5 sm:p-8" delay={0.5}>
          <h3 className="text-lg font-black text-slate-900 mb-8">Teacher Network</h3>
          
          <div className="h-[140px] sm:h-[180px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={teacherData}
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="95%"
                  paddingAngle={8}
                  dataKey="value"
                >
                  {teacherData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <p className="text-xl font-black text-slate-900 leading-none">{stats.totalTeachers}</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Teachers</p>
            </div>
          </div>

          <div className="mt-8 space-y-2.5">
            {teacherData.map((item) => (
              <div 
                key={item.name} 
                className="flex items-center justify-between text-xs font-black uppercase tracking-wider py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      {/* ─── Bottom Grid ─── */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Course Directory (8/12) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-900">Recent Batches</h3>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/admin/batches?new=true")}
              className="hidden sm:flex px-6 py-3 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest items-center gap-2 shadow-xl"
            >
              <Plus className="w-4 h-4" /> New Batch
            </motion.button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            {recentBatches.slice(0, 4).map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + (i * 0.05) }}
                onClick={() => navigate(`/admin/batches/${course.id}`)}
                className={cn(
                  "group flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-2 sm:gap-5 p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-2xl transition-all cursor-pointer text-center sm:text-left aspect-square sm:aspect-auto",
                  i === 3 && "sm:flex"
                )}
              >
                <CourseThumbnail name={course.name} examTarget={course.examTarget} imageUrl={course.thumbnailUrl} className="w-10 h-10 sm:w-14 sm:h-14 mb-1 sm:mb-0" />
                <div className="flex-1 min-w-0 w-full">
                  <h4 className="text-xs sm:text-base font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{course.name}</h4>
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-wider mt-0.5 sm:mt-1 truncate">{course.examTarget} · {course.studentCount} Students</p>
                </div>
                <ChevronRight className="hidden sm:block w-5 h-5 shrink-0 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/admin/batches?new=true")}
            className="flex sm:hidden w-full h-12 mt-4 items-center justify-center rounded-2xl bg-slate-900 text-white text-sm font-black uppercase tracking-widest shadow-xl active:scale-[0.98] transition-transform"
          >
            <Plus className="w-5 h-5 mr-2" /> New Batch
          </motion.button>
        </div>

        {/* Doubts (4/12) */}
        <div className="xl:col-span-4">
          <GlassCard className="p-5 sm:p-8 h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-900">Urgent Doubts</h3>
              <button onClick={() => navigate("/teacher/doubts")} className="text-[10px] font-black uppercase tracking-widest text-blue-600 font-bold">View All</button>
            </div>
            
            <div className="space-y-4">
              {recentDoubts.slice(0, 4).map((d, i) => (
                <div 
                  key={d.id} 
                  onClick={() => navigate("/teacher/doubts")}
                  className={cn(
                    "p-4.5 rounded-2xl bg-white border border-slate-100 hover:border-orange-200 transition-colors cursor-pointer group",
                    i === 3 && "hidden sm:block"
                  )}
                >
                  <p className="text-[15px] sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {d.questionText || d.topicName || "New Doubt Received"}
                  </p>
                  <div className="flex items-center justify-between mt-3.5 sm:mt-3">
                     <span className="text-[11px] sm:text-[10px] font-bold text-slate-500 truncate max-w-[120px]">{d.studentName}</span>
                     <span className="text-[9px] sm:text-[8px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;

