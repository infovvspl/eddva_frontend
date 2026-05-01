import { useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Flame, Trophy, Video,
  Brain, TrendingUp, TrendingDown, CheckCircle,
  XCircle, Clock, BarChart2, Flag, UserMinus, MessageCircle,
  Target, Zap, BookOpen, Activity, AlertCircle, LayoutDashboard,
  ShieldCheck, ArrowRight,
} from "lucide-react";
import ProgressReportTree from "@/components/shared/ProgressReportTree";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getStudentDetail,
  getStudentAdvancedPerformance,
  getStudentAdvancedEngagement,
  getStudentAdvancedStudyPlan,
  getStudentRiskSignals,
  getStudentInsights,
  type StudentDetail,
  type EngagementState,
} from "@/lib/api/teacher";
import FlagStudentModal from "@/components/teacher/FlagStudentModal";
import RemoveStudentDialog from "@/components/teacher/RemoveStudentDialog";
import { AdvancedMetricCard } from "@/components/teacher/AdvancedMetricCard";
import { StudentRiskSignals } from "@/components/teacher/StudentRiskSignals";
import { StudentQuickActions } from "@/components/teacher/StudentQuickActions";
import { useAuthStore } from "@/lib/auth-store";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const engagementConfig: Record<EngagementState, { label: string; color: string; icon: React.ReactNode }> = {
  engaged:    { label: "Engaged",    color: "text-green-400",  icon: <CheckCircle className="w-4 h-4" /> },
  thriving:   { label: "Thriving",   color: "text-emerald-400", icon: <TrendingUp className="w-4 h-4" /> },
  bored:      { label: "Bored",      color: "text-yellow-400", icon: <Clock className="w-4 h-4" /> },
  confused:   { label: "Confused",   color: "text-orange-400", icon: <Brain className="w-4 h-4" /> },
  frustrated: { label: "Frustrated", color: "text-red-400",    icon: <TrendingDown className="w-4 h-4" /> },
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function daysAgo(dateStr: string | null) {
  if (!dateStr) return "Never";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-10 text-right text-foreground">{score}</span>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: any }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {Icon && <div className="p-2 rounded-xl bg-primary/10 text-primary"><Icon className="w-5 h-5" /></div>}
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherStudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get("batchId") ?? "";
  const navigate = useNavigate();

  const [flagOpen, setFlagOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const { user } = useAuthStore();

  // Parallel Data Fetching
  const studentQuery = useQuery<StudentDetail>({
    queryKey: ["teacher", "student-detail", batchId, studentId],
    queryFn: () => getStudentDetail(batchId, studentId!),
    enabled: !!studentId,
  });

  const perfQuery = useQuery({
    queryKey: ["teacher", "student-perf-advanced", studentId, batchId],
    queryFn: () => getStudentAdvancedPerformance(studentId!, batchId),
    enabled: !!studentId,
  });

  const engageQuery = useQuery({
    queryKey: ["teacher", "student-engage-advanced", studentId, batchId],
    queryFn: () => getStudentAdvancedEngagement(studentId!, batchId),
    enabled: !!studentId,
  });

  const planQuery = useQuery({
    queryKey: ["teacher", "student-plan-advanced", studentId, batchId],
    queryFn: () => getStudentAdvancedStudyPlan(studentId!, batchId),
    enabled: !!studentId,
  });

  const signalsQuery = useQuery({
    queryKey: ["teacher", "student-risk-signals", studentId, batchId],
    queryFn: () => getStudentRiskSignals(studentId!, batchId),
    enabled: !!studentId,
  });

  // Insights Derivation
  const insights = useMemo(() => {
    if (perfQuery.data && engageQuery.data && planQuery.data && signalsQuery.data) {
      return getStudentInsights(perfQuery.data, engageQuery.data, planQuery.data, signalsQuery.data);
    }
    return null;
  }, [perfQuery.data, engageQuery.data, planQuery.data, signalsQuery.data]);

  const isLoading = studentQuery.isLoading || perfQuery.isLoading || engageQuery.isLoading || planQuery.isLoading || signalsQuery.isLoading;
  const isError = studentQuery.isError;

  if (isLoading) return <div className="p-6 max-w-7xl mx-auto space-y-6"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (isError || !studentQuery.data) return <div className="p-8 text-center"><Button onClick={() => studentQuery.refetch()}>Retry</Button></div>;

  const { profile, attendance, lectures, testScores } = studentQuery.data;
  const engagement = profile.aiEngagementState ? engagementConfig[profile.aiEngagementState] : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header & Quick Actions Container */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Profile Section */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-primary/10 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Student Deep Dive</h1>
              <p className="text-sm text-muted-foreground">Comprehensive tracking & behavioral insights</p>
            </div>
          </div>

          <div className="card-surface p-6 sm:p-8 relative overflow-hidden group border-primary/5">
            {/* Advanced Decorative Elements */}
            <div className={`absolute top-0 right-0 w-64 h-64 blur-[120px] opacity-20 transition-colors duration-1000 ${insights?.riskStatus === "critical" ? "bg-red-500" : insights?.riskStatus === "warning" ? "bg-yellow-500" : "bg-primary"}`} />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/5 blur-[80px] rounded-full" />
            
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl font-black text-primary border-2 border-primary/20 shadow-xl shadow-primary/10">
                  {getInitials(profile.name)}
                </div>
                {insights?.riskStatus === "critical" && (
                  <div className="absolute -top-3 -right-3 p-2 bg-red-500 rounded-full border-4 border-card animate-pulse shadow-lg shadow-red-500/50">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4 text-center md:text-left w-full">
                <div className="space-y-1">
                  <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-foreground tracking-tight">{profile.name}</h2>
                    {engagement && (
                      <Badge variant="outline" className={`gap-1.5 border-none ${engagement.color} bg-current/10 py-1 px-3 rounded-full text-[10px] font-black uppercase tracking-wider`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-current animate-pulse`} />
                        {engagement.label}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground font-bold">
                    <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1 rounded-full border border-border/50">
                      <Target className="w-3.5 h-3.5 text-primary/70" />
                      <span>Class {profile.class}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1 rounded-full border border-border/50">
                      <Zap className="w-3.5 h-3.5 text-yellow-500/70" />
                      <span>{profile.examTarget?.toUpperCase()} {profile.examYear}</span>
                    </div>
                    {profile.targetCollege && (
                      <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1 rounded-full border border-primary/10 text-primary/90">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>{profile.targetCollege}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="flex flex-col items-center md:items-start px-4 py-2 rounded-2xl bg-muted/20 border border-border/40">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Current Streak</span>
                    <span className="text-sm font-black text-foreground flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />
                      {profile.streakDays} Days
                    </span>
                  </div>
                  <div className="flex flex-col items-center md:items-start px-4 py-2 rounded-2xl bg-muted/20 border border-border/40">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Total XP</span>
                    <span className="text-sm font-black text-foreground flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                      {profile.xpTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-center md:items-start px-4 py-2 rounded-2xl bg-muted/20 border border-border/40">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Presence</span>
                    <span className="text-sm font-black text-foreground flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary/70" />
                      {daysAgo(profile.lastLoginAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  className="flex-1 md:flex-none justify-center rounded-full border-orange-500/20 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/40 h-10 px-6 font-bold transition-all duration-300" 
                  onClick={() => setFlagOpen(true)}
                >
                  <Flag className="w-4 h-4 mr-2" /> Flag
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 md:flex-none justify-center rounded-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40 h-10 px-6 font-bold transition-all duration-300" 
                  onClick={() => setRemoveOpen(true)}
                >
                  <UserMinus className="w-4 h-4 mr-2" /> Remove
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Layer */}
        {user?.role !== "institute_admin" && (
          <div className="lg:w-80 shrink-0">
            <StudentQuickActions 
              studentId={studentId!} 
              batchId={batchId} 
              studentName={profile.name ?? ""}
              insights={insights ?? undefined}
            />
          </div>
        )}
      </div>

      {/* Top Insights Layer (Above the fold) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdvancedMetricCard 
          label="Risk Status"
          value={insights?.riskStatus.toUpperCase() ?? "LOADING"}
          status={insights?.riskStatus === "critical" ? "red" : insights?.riskStatus === "warning" ? "yellow" : "green"}
          icon={<ShieldCheck className="w-4 h-4" />}
          tooltip="Calculated from inactivity, score drops, and plan skips."
        />
        <AdvancedMetricCard 
          label="Performance Trend"
          value={insights?.performanceTrend.toUpperCase() ?? "STABLE"}
          trend={insights?.performanceTrend}
          icon={<TrendingUp className="w-4 h-4" />}
          tooltip="Calculated from last 5 test scores vs batch average."
        />
        <AdvancedMetricCard 
          label="Syllabus Coverage"
          value={`${attendance.attendancePct}%`}
          subValue={`${attendance.watchedLectures}/${attendance.totalLectures} Lec`}
          icon={<LayoutDashboard className="w-4 h-4" />}
          tooltip="Overall progress across all subjects in this batch."
        />
        <AdvancedMetricCard 
          label="Engagement Score"
          value={`${insights?.engagementScore ?? 0}/100`}
          status={(insights?.engagementScore ?? 0) > 70 ? "green" : (insights?.engagementScore ?? 0) > 40 ? "yellow" : "red"}
          icon={<Activity className="w-4 h-4" />}
          tooltip="Composite score of daily active minutes, interaction rate, and doubt frequency."
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-px">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            {["overview", "performance", "engagement", "plan", "advanced"].map((t) => (
              <TabsTrigger 
                key={t} 
                value={t} 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm font-bold capitalize tracking-tight"
              >
                {t === "plan" ? "Study Plan" : t}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* 1. Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card-surface p-6">
                <SectionHeader title="Early Warning Signals" subtitle="Automated risk detection based on Section 11 metrics" icon={AlertCircle} />
                {signalsQuery.isLoading ? <Skeleton className="h-40 w-full" /> : <StudentRiskSignals signals={signalsQuery.data ?? []} studentName={profile.name ?? ""} />}
              </div>
              
              <div className="card-surface p-6">
                <SectionHeader title="Recent Activity" subtitle="Last 48 hours of platform interaction" icon={Activity} />
                <div className="space-y-4">
                  {/* Placeholder for activity log */}
                  <p className="text-xs text-muted-foreground text-center py-8">Activity log being populated...</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card-surface p-6">
                <SectionHeader title="Syllabus Gap" subtitle="Topics never touched" icon={Target} />
                <div className="space-y-3">
                  {(insights?.topWeakTopics ?? []).map((topic, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                      <span className="text-xs font-bold">{topic}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  ))}
                  {(!insights?.topWeakTopics.length) && <p className="text-xs text-muted-foreground italic text-center py-4">No gaps detected.</p>}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. Performance Tab */}
        <TabsContent value="performance" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card-surface p-6">
                <SectionHeader title="Score Trend" subtitle="Performance over time vs Batch Average" icon={TrendingUp} />
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-2xl">
                   <p className="text-sm text-muted-foreground">Interactive Chart Integration Pending</p>
                </div>
              </div>
              
              <div className="card-surface p-6">
                <SectionHeader title="Topic Performance" subtitle="Accuracy and Time metrics per topic" icon={Target} />
                <div className="space-y-4">
                  {(perfQuery.data?.topicPerformance ?? []).map((t, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1 text-xs font-bold uppercase">
                          <span>{t.topicName}</span>
                          <span>{t.accuracy}%</span>
                        </div>
                        <ScoreBar score={t.accuracy ?? 0} />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-foreground">{t.timeTaken}s</p>
                        <p className="text-[8px] text-muted-foreground uppercase">Avg Time</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card-surface p-6">
                <SectionHeader title="Mistake Patterns" subtitle="Behavioral gaps in MCQs" icon={Zap} />
                <div className="space-y-4">
                  {(perfQuery.data?.mistakePatterns ?? []).map((p, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{p.type}</span>
                        <span className="text-primary">{p.count}x</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 3. Engagement Tab */}
        <TabsContent value="engagement" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div className="card-surface p-6">
                <SectionHeader title="Daily Active Minutes" icon={Clock} />
                <div className="h-48 border border-dashed rounded-xl flex items-center justify-center text-xs text-muted-foreground">Chart Content</div>
             </div>
             <div className="card-surface p-6">
                <SectionHeader title="Content Preference" icon={Video} />
                <div className="space-y-4">
                  {(engageQuery.data?.contentPreference ?? []).map((c, i) => (
                    <div key={i} className="space-y-1">
                       <div className="flex justify-between text-xs font-bold">
                         <span>{c.type}</span>
                         <span>{c.percentage}%</span>
                       </div>
                       <div className="h-1 bg-muted rounded-full overflow-hidden">
                         <div className="h-full bg-primary" style={{ width: `${c.percentage}%` }} />
                       </div>
                    </div>
                  ))}
                </div>
             </div>
             <div className="card-surface p-6">
                <SectionHeader title="Lecture Drop-offs" subtitle="Watch heatmap timestamps" icon={Activity} />
                <div className="h-48 border border-dashed rounded-xl flex items-center justify-center text-xs text-muted-foreground">Heatmap View</div>
             </div>
          </div>
        </TabsContent>

        {/* 4. Study Plan Tab */}
        <TabsContent value="plan" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 card-surface p-6">
               <SectionHeader title="Plan Adherence" subtitle="Daily & Weekly completion vs skips" icon={LayoutDashboard} />
               <div className="grid grid-cols-3 gap-8 text-center py-6">
                  <div>
                    <p className="text-3xl font-black text-emerald-500">{planQuery.data?.adherence?.completed ?? 0}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Completed</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-orange-500">{planQuery.data?.adherence?.skipped ?? 0}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Skipped</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-muted-foreground">{planQuery.data?.adherence?.pending ?? 0}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Pending</p>
                  </div>
               </div>
            </div>
            <div className="card-surface p-6">
               <SectionHeader title="Plan Metrics" icon={Zap} />
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-medium">Avg Start Delay</span>
                    <span className="text-sm font-black">{planQuery.data?.startDelayAvgHours}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-medium">Overdue Items</span>
                    <span className="text-sm font-black text-red-500">{planQuery.data?.overdueItemsCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-medium">Regeneration Freq</span>
                    <span className="text-sm font-black">{planQuery.data?.regenerationFrequency}x / wk</span>
                  </div>
               </div>
            </div>
          </div>
        </TabsContent>

        {/* 5. Advanced (Collapsible Deep Dive) */}
        <TabsContent value="advanced" className="mt-0">
          <div className="p-8 border-2 border-dashed border-border rounded-3xl text-center space-y-4 bg-muted/20">
             <LayoutDashboard className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
             <div>
                <h3 className="text-lg font-black text-foreground">Advanced Raw Metrics</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">This section contains low-noise behavioral signals like session distribution, dead notes count, and detailed AI feature logs.</p>
             </div>
             <Button variant="outline" className="font-bold border-primary/20 text-primary">Expand 11-Category Deep Dive</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <FlagStudentModal open={flagOpen} onOpenChange={setFlagOpen} batchId={batchId} studentId={studentId!} studentName={profile.name} onSuccess={() => toast.success("Student flagged — notifications sent")} />
      <RemoveStudentDialog open={removeOpen} onOpenChange={setRemoveOpen} batchId={batchId} studentId={studentId!} studentName={profile.name} onSuccess={() => { toast.success("Student removed from batch"); navigate(-1); }} />
    </div>
  );
}
