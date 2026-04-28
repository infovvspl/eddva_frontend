import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  Target, 
  Activity, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Brain,
  Video,
  LayoutDashboard,
  ArrowRight,
  TrendingDown,
  Minus
} from "lucide-react";
import { 
  getMyAdvancedPerformance, 
  getMyAdvancedEngagement, 
  getMyAdvancedStudyPlan, 
  getMyProgressInsights 
} from "@/lib/api/student";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AdvancedMetricCard } from "@/components/teacher/AdvancedMetricCard";
import { Badge } from "@/components/ui/badge";

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function ProgressIndicator({ value, label, color = "primary" }: { value: number; label: string; color?: string }) {
  const colorMap: any = {
    primary: "bg-primary",
    emerald: "bg-emerald-500",
    orange: "bg-orange-500",
    red: "bg-red-500"
  };
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color]} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentProgressPage() {
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get("batchId") ?? undefined;

  const insightsQuery = useQuery({
    queryKey: ["student", "insights", batchId],
    queryFn: () => getMyProgressInsights(batchId),
  });

  const perfQuery = useQuery({
    queryKey: ["student", "perf-advanced", batchId],
    queryFn: () => getMyAdvancedPerformance(batchId),
  });

  const engageQuery = useQuery({
    queryKey: ["student", "engage-advanced", batchId],
    queryFn: () => getMyAdvancedEngagement(batchId),
  });

  const planQuery = useQuery({
    queryKey: ["student", "plan-advanced", batchId],
    queryFn: () => getMyAdvancedStudyPlan(batchId),
  });

  const isLoading = insightsQuery.isLoading || perfQuery.isLoading || engageQuery.isLoading || planQuery.isLoading;

  if (isLoading) return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-pulse">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
      </div>
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  );

  const insights = insightsQuery.data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Performance Deep Dive</h1>
          <p className="text-sm text-muted-foreground">Detailed analysis of your learning patterns & readiness.</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="px-3 py-1 bg-primary/5 border-primary/20 text-primary font-bold">
             STATUS: {insights?.status.replace("_", " ").toUpperCase() ?? "ON TRACK"}
           </Badge>
        </div>
      </div>

      {/* Top Level Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdvancedMetricCard 
          label="Readiness Score"
          value={`${insights?.readinessScore ?? 0}%`}
          status={(insights?.readinessScore ?? 0) > 80 ? "green" : (insights?.readinessScore ?? 0) > 50 ? "yellow" : "red"}
          icon={<ShieldCheck className="w-4 h-4" />}
          tooltip="A composite of syllabus coverage and test accuracy."
        />
        <AdvancedMetricCard 
          label="Performance Trend"
          value={insights?.performanceTrend.toUpperCase() ?? "STABLE"}
          trend={insights?.performanceTrend}
          icon={<TrendingUp className="w-4 h-4" />}
          tooltip="Calculated from your last 10 quiz attempts."
        />
        <AdvancedMetricCard 
          label="Consistency"
          value={`${insights?.consistencyScore ?? 0}%`}
          icon={<Activity className="w-4 h-4" />}
          tooltip="Based on daily platform interaction and study plan adherence."
        />
        <AdvancedMetricCard 
          label="Weak Topics"
          value={insights?.weakTopicCount ?? 0}
          status={(insights?.weakTopicCount ?? 0) > 5 ? "red" : (insights?.weakTopicCount ?? 0) > 2 ? "yellow" : "green"}
          icon={<Brain className="w-4 h-4" />}
          tooltip="Topics where your accuracy is below 50%."
        />
      </div>

      {/* Detail Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <div className="flex items-center border-b border-border">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            {["performance", "engagement", "study-plan"].map((t) => (
              <TabsTrigger 
                key={t} 
                value={t} 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm font-bold capitalize tracking-tight"
              >
                {t.replace("-", " ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* 1. Performance Tab */}
        <TabsContent value="performance" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 card-surface p-6">
                <SectionHeader title="Score History" subtitle="Your accuracy trend over time" icon={TrendingUp} />
                <div className="h-64 border-2 border-dashed border-border rounded-2xl flex items-center justify-center text-xs text-muted-foreground">
                  Score Chart Integration
                </div>
             </div>
             
             <div className="card-surface p-6">
                <SectionHeader title="Mistake Analysis" subtitle="Where you lose points" icon={Zap} />
                <div className="space-y-4">
                  {perfQuery.data?.mistakePatterns.map((p, i) => (
                    <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border/50">
                       <div className="flex justify-between mb-1">
                         <span className="text-xs font-bold text-foreground">{p.type}</span>
                         <span className="text-[10px] text-primary font-black">{p.count}x</span>
                       </div>
                       <p className="text-[10px] text-muted-foreground">{p.description}</p>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          <div className="card-surface p-6">
             <SectionHeader title="Topic Mastery" subtitle="Detailed breakdown of topic-wise accuracy" icon={Target} />
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
                {perfQuery.data?.topicPerformance.map((t, i) => (
                  <ProgressIndicator key={i} label={t.topicName} value={t.accuracy} color={t.accuracy > 70 ? "emerald" : t.accuracy > 40 ? "orange" : "red"} />
                ))}
             </div>
          </div>
        </TabsContent>

        {/* 2. Engagement Tab */}
        <TabsContent value="engagement" className="mt-0 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card-surface p-6">
                 <SectionHeader title="Active Learning" icon={Activity} />
                 <div className="space-y-6">
                    <div className="text-center py-4">
                       <p className="text-4xl font-black text-primary">{(engageQuery.data?.dailyActiveMinutes ?? []).reduce((a, b) => a + b.minutes, 0)}</p>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Minutes this week</p>
                    </div>
                    <div className="space-y-3">
                       <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Notes Generated</span>
                          <span className="font-bold">{engageQuery.data?.notesGenerated}</span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">AI Tutor Sessions</span>
                          <span className="font-bold">{engageQuery.data?.aiTutorSessions}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="card-surface p-6">
                 <SectionHeader title="Content Preference" icon={Video} />
                 <div className="space-y-4">
                    {(engageQuery.data?.contentPreference ?? []).map((c, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
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
                 <SectionHeader title="Lecture Attendance" icon={Video} />
                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-center">
                          <p className="text-2xl font-black text-foreground">{engageQuery.data?.lectureActivity?.completed ?? 0}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase">Completed</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-center">
                          <p className="text-2xl font-black text-foreground">{(engageQuery.data?.lectureActivity?.totalWatched ?? 0) - (engageQuery.data?.lectureActivity?.completed ?? 0)}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase">In Progress</p>
                       </div>
                    </div>
                    <ProgressIndicator label="Avg Watch Percentage" value={engageQuery.data?.lectureActivity?.avgWatchPct ?? 0} />
                 </div>
              </div>
           </div>
        </TabsContent>

        {/* 3. Study Plan Tab */}
        <TabsContent value="plan" className="mt-0 space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 card-surface p-6">
                 <SectionHeader title="Plan Adherence" icon={LayoutDashboard} />
                 <div className="grid grid-cols-3 gap-8 py-8">
                    <div className="text-center">
                       <p className="text-4xl font-black text-emerald-500">{planQuery.data?.adherence?.completed ?? 0}</p>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Completed</p>
                    </div>
                    <div className="text-center">
                       <p className="text-4xl font-black text-orange-500">{planQuery.data?.adherence?.skipped ?? 0}</p>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Skipped</p>
                    </div>
                    <div className="text-center">
                       <p className="text-4xl font-black text-muted-foreground">{planQuery.data?.adherence?.pending ?? 0}</p>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Pending</p>
                    </div>
                 </div>
              </div>

              <div className="card-surface p-6 space-y-6">
                 <SectionHeader title="Consistency" icon={Zap} />
                 <div className="text-center p-6 rounded-3xl bg-primary/5 border border-primary/20">
                    <p className="text-5xl font-black text-primary">{planQuery.data?.currentStreak}</p>
                    <p className="text-xs font-bold text-primary/70 uppercase mt-1">Day Streak</p>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Overdue Tasks</span>
                    <span className="font-bold text-red-500">{planQuery.data?.overdueItemsCount}</span>
                 </div>
              </div>
           </div>
        </TabsContent>
      </Tabs>

      {/* Actionable Suggestions */}
      <div className="card-surface p-8 border-primary/20 bg-primary/5 rounded-3xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck className="w-32 h-32 text-primary" />
         </div>
         <div className="relative z-10 max-w-2xl space-y-4">
            <h3 className="text-xl font-black text-foreground">AI Performance Insights</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
               Based on your current readiness score of <span className="font-bold text-foreground">{insights?.readinessScore}%</span>, 
               you are on track for your target exam. However, your <span className="font-bold text-foreground">Time Management</span> in physics quizzes 
               is a bottleneck. We recommend focusing on "Work Power Energy" practice sessions.
            </p>
            <div className="flex gap-4 pt-2">
               <button className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                 Fix Weak Topics
               </button>
               <button className="px-6 py-2 rounded-xl border border-primary/20 text-primary text-sm font-bold hover:bg-primary/5 transition-colors">
                 View Topic Breakdown
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
