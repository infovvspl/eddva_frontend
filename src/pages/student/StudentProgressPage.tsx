import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  Minus,
  ChevronRight,
  Calendar,
  BarChart2,
  BookOpen
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import {
  getMyAdvancedStudyPlan,
  getMyAdvancedPerformance,
  getMyAdvancedEngagement,
  getMyProgressInsights,
  getMyPerformance,
  type WeakTopic,
} from "@/lib/api/student";
import { useHasAiFeature } from "@/hooks/use-tenant-features";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AdvancedMetricCard } from "@/components/teacher/AdvancedMetricCard";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProgressReportTree from "@/components/shared/ProgressReportTree";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const navigate = useNavigate();
  const batchId = searchParams.get("batchId") ?? undefined;
  const [activeTab, setActiveTab] = useState("performance");
  const aiPlanEnabled = useHasAiFeature("ai_study_plan");
  const progressTabs = aiPlanEnabled
    ? ["performance", "engagement", "study-plan", "syllabus"]
    : ["performance", "engagement", "syllabus"];
  const [timeRange, setTimeRange] = useState("week");

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl text-xs">
          <p className="font-bold mb-1 text-foreground">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
              <span className="w-2 h-2 rounded-full bg-current" />
              {p.name}: <span className="font-bold">{p.value}{p.unit || ""}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [showWeakTopics, setShowWeakTopics] = useState(false);
  const [selectedMistake, setSelectedMistake] = useState<{ type: string; count: number; description: string } | null>(null);

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    scoreHistory: false,
    mistakeAnalysis: false,
    topicMastery: false,
    activeLearning: false,
    contentPreference: false,
    lectureAttendance: false,
    curriculumRoadmap: false,
    planAdherence: false,
    consistency: false,
  });

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const insightsQuery = useQuery({
    queryKey: ["student", "insights", batchId],
    queryFn: () => getMyProgressInsights(batchId),
  });

  const perfQuery = useQuery({
    queryKey: ["student", "perf-advanced", batchId],
    queryFn: () => getMyAdvancedPerformance(batchId),
  });

  const fullPerfQuery = useQuery({
    queryKey: ["student", "perf-full"],
    queryFn: getMyPerformance,
    enabled: showWeakTopics || !!selectedMistake,
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
    <div className="p-6 w-full space-y-8 animate-pulse">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
      </div>
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  );

  const insights = insightsQuery.data;
  const weakTopics = fullPerfQuery.data?.weakTopics ?? [];

  return (
    <div className="p-6 w-full space-y-8 animate-in fade-in duration-500">

      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2 sm:gap-3">
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Performance Deep-Dive
          </h1>
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap mt-1 sm:mt-1.5">
            <p className="text-muted-foreground font-medium text-xs sm:text-sm">Pin-point analysis of your academic journey</p>
            <div className="flex items-center gap-1.5 bg-muted/30 p-0.5 rounded-lg border border-border/50">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[115px] bg-transparent border-none shadow-none font-bold text-[10px] sm:text-xs h-7 px-2">
                  <Calendar className="w-3 h-3 mr-1 text-primary" />
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Last 24 Hours</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Top Level Insight Cards */}
      <div className="flex flex-row flex-nowrap overflow-x-auto scrollbar-none gap-3 pb-3 lg:grid lg:grid-cols-4 lg:gap-4 lg:pb-0">
        <div className="shrink-0 w-[128px] h-[145px] lg:w-auto lg:h-auto">
          <AdvancedMetricCard
            label="Readiness Score"
            value={`${insights?.readinessScore ?? 0}%`}
            status={(insights?.readinessScore ?? 0) > 80 ? "green" : (insights?.readinessScore ?? 0) > 50 ? "yellow" : "red"}
            icon={<ShieldCheck className="w-4 h-4" />}
            tooltip="A composite of syllabus coverage and test accuracy."
            onClick={() => setSelectedInsight("Readiness Score")}
            iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
        </div>
        <div className="shrink-0 w-[128px] h-[145px] lg:w-auto lg:h-auto">
          <AdvancedMetricCard
            label="Performance Trend"
            value={insights?.performanceTrend.toUpperCase() ?? "STABLE"}
            trend={insights?.performanceTrend}
            icon={<TrendingUp className="w-4 h-4" />}
            tooltip="Calculated from your last 10 quiz attempts."
            onClick={() => setSelectedInsight("Performance Trend")}
            iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
        </div>
        <div className="shrink-0 w-[128px] h-[145px] lg:w-auto lg:h-auto">
          <AdvancedMetricCard
            label="Consistency"
            value={`${insights?.consistencyScore ?? 0}%`}
            icon={<Activity className="w-4 h-4" />}
            tooltip="Based on daily platform interaction and study plan adherence."
            onClick={() => setSelectedInsight("Consistency")}
            iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
        </div>
        <div className="shrink-0 w-[128px] h-[145px] lg:w-auto lg:h-auto">
          <AdvancedMetricCard
            label="Weak Topics"
            value={insights?.weakTopicCount ?? 0}
            status={(insights?.weakTopicCount ?? 0) > 5 ? "red" : (insights?.weakTopicCount ?? 0) > 2 ? "yellow" : "green"}
            icon={<Brain className="w-4 h-4" />}
            tooltip="Topics where your accuracy is below 50%."
            onClick={() => setShowWeakTopics(true)}
            iconClassName="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          />
        </div>
      </div>

      {/* Detail Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center border-b border-border overflow-x-auto scrollbar-none">
          <TabsList className="bg-transparent h-auto p-0 gap-6 sm:gap-8 flex flex-row flex-nowrap">
            {progressTabs.map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm font-bold capitalize tracking-tight shrink-0"
              >
                {t.replace("-", " ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* 1. Performance Tab */}
        <TabsContent value="performance" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div 
              onClick={() => toggleCard("scoreHistory")}
              className="lg:col-span-2 card-surface p-4 sm:p-6 cursor-pointer sm:cursor-default"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <SectionHeader title="Score History" subtitle="Your accuracy trend over time" icon={TrendingUp} />
                </div>
                <span className="sm:hidden text-[11px] text-primary font-bold border border-primary/20 rounded-md px-2 py-0.5 bg-primary/5 uppercase tracking-wider mb-3">
                  {expandedCards.scoreHistory ? "Hide" : "Show"}
                </span>
              </div>
              <div className={`${expandedCards.scoreHistory ? "block" : "hidden sm:block"} h-[200px] sm:h-[280px] w-full mt-2 sm:mt-4`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={perfQuery.data?.scoreTrend ?? []}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      name="Accuracy"
                      unit="%"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#scoreColor)"
                      dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div 
              onClick={() => toggleCard("mistakeAnalysis")}
              className="card-surface p-4 sm:p-6 cursor-pointer sm:cursor-default"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <SectionHeader title="Mistake Analysis" subtitle="Where you lose points" icon={Zap} />
                </div>
                <span className="sm:hidden text-[11px] text-primary font-bold border border-primary/20 rounded-md px-2 py-0.5 bg-primary/5 uppercase tracking-wider mb-3">
                  {expandedCards.mistakeAnalysis ? "Hide" : "Show"}
                </span>
              </div>
              <div className={`${expandedCards.mistakeAnalysis ? "block" : "hidden sm:block"} space-y-2.5 sm:space-y-4 mt-2 sm:mt-4`}>
                {perfQuery.data?.mistakePatterns.map((p, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMistake(p);
                    }}
                    className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/40 hover:bg-muted/65 transition-all cursor-pointer block"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{p.type}</span>
                      <span className="text-[10px] text-primary font-bold">{p.count}x</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div 
            id="topic-mastery" 
            onClick={() => toggleCard("topicMastery")}
            className="card-surface p-4 sm:p-6 cursor-pointer sm:cursor-default"
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <SectionHeader title="Topic Mastery" subtitle="Detailed breakdown of topic-wise accuracy" icon={Target} />
              </div>
              <span className="sm:hidden text-[11px] text-primary font-bold border border-primary/20 rounded-md px-2 py-0.5 bg-primary/5 uppercase tracking-wider mb-3">
                {expandedCards.topicMastery ? "Hide" : "Show"}
              </span>
            </div>
            <div className={`${expandedCards.topicMastery ? "grid" : "hidden sm:grid"} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 sm:gap-x-12 sm:gap-y-6 mt-2 sm:mt-4`}>
              {perfQuery.data?.topicPerformance.map((t, i) => (
                <ProgressIndicator key={i} label={t.topicName} value={t.accuracy} color={t.accuracy > 70 ? "emerald" : t.accuracy > 40 ? "orange" : "red"} />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 2. Engagement Tab */}
        <TabsContent value="engagement" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              onClick={() => toggleCard("activeLearning")}
              className="card-surface p-4 sm:p-6 cursor-pointer sm:cursor-default"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <SectionHeader title="Active Learning" icon={Activity} />
                </div>
                <span className="sm:hidden text-[11px] text-primary font-bold border border-primary/20 rounded-md px-2 py-0.5 bg-primary/5 uppercase tracking-wider mb-3">
                  {expandedCards.activeLearning ? "Hide" : "Show"}
                </span>
              </div>
              <div className={`${expandedCards.activeLearning ? "block" : "hidden sm:block"} space-y-4 sm:space-y-6 mt-2 sm:mt-4`}>
                <div className="h-[200px] sm:h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engageQuery.data?.dailyActiveMinutes ?? []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="minutes"
                        name="Study Time"
                        unit="m"
                        fill="hsl(var(--primary))"
                        radius={[6, 6, 0, 0]}
                      >
                        {(engageQuery.data?.dailyActiveMinutes ?? []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.minutes > 120 ? 'hsl(var(--primary))' : 'rgba(var(--primary-rgb), 0.4)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 pt-2">
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

            <div 
              onClick={() => toggleCard("contentPreference")}
              className="card-surface p-4 sm:p-6 cursor-pointer sm:cursor-default"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <SectionHeader title="Content Preference" icon={Video} />
                </div>
                <span className="sm:hidden text-[11px] text-primary font-bold border border-primary/20 rounded-md px-2 py-0.5 bg-primary/5 uppercase tracking-wider mb-3">
                  {expandedCards.contentPreference ? "Hide" : "Show"}
                </span>
              </div>
              <div className={`${expandedCards.contentPreference ? "block" : "hidden sm:block"} space-y-4 mt-2 sm:mt-4`}>
                {(engageQuery.data?.contentPreference ?? []).map((c: any, i: number) => (
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

            <div 
              onClick={() => toggleCard("lectureAttendance")}
              className="card-surface p-4 sm:p-6 cursor-pointer sm:cursor-default"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <SectionHeader title="Lecture Attendance" icon={Video} />
                </div>
                <span className="sm:hidden text-[11px] text-primary font-bold border border-primary/20 rounded-md px-2 py-0.5 bg-primary/5 uppercase tracking-wider mb-3">
                  {expandedCards.lectureAttendance ? "Hide" : "Show"}
                </span>
              </div>
              <div className={`${expandedCards.lectureAttendance ? "block" : "hidden sm:block"} space-y-4 sm:space-y-6 mt-2 sm:mt-4`}>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/50 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{engageQuery.data?.lectureActivity?.completed ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Completed</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/50 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{(engageQuery.data?.lectureActivity?.totalWatched ?? 0) - (engageQuery.data?.lectureActivity?.completed ?? 0)}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">In Progress</p>
                  </div>
                </div>
                <ProgressIndicator label="Avg Watch Percentage" value={engageQuery.data?.lectureActivity?.avgWatchPct ?? 0} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 3. Syllabus Tab */}
        <TabsContent value="syllabus" className="mt-0 space-y-4 sm:space-y-6">
          <div 
            onClick={() => toggleCard("curriculumRoadmap")}
            className="card-surface p-4 sm:p-6 cursor-pointer sm:cursor-default"
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <SectionHeader title="Curriculum Roadmap" subtitle="Full breakdown of your course progress" icon={BookOpen} />
              </div>
              <span className="sm:hidden text-[11px] text-primary font-bold border border-primary/20 rounded-md px-2 py-0.5 bg-primary/5 uppercase tracking-wider mb-3">
                {expandedCards.curriculumRoadmap ? "Hide" : "Show"}
              </span>
            </div>
            <div className={`${expandedCards.curriculumRoadmap ? "block" : "hidden sm:block"} bg-muted/10 rounded-xl sm:rounded-2xl border border-border/50 p-4 sm:p-6 mt-2 sm:mt-4`}>
              <ProgressReportTree />
            </div>
          </div>
        </TabsContent>

        {/* 3. Study Plan Tab */}
        <TabsContent value="study-plan" className="mt-0 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            <div 
              onClick={() => toggleCard("planAdherence")}
              className="lg:col-span-3 card-surface p-4 sm:p-6 cursor-pointer sm:cursor-default"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <SectionHeader title="Plan Adherence" icon={LayoutDashboard} />
                </div>
                <span className="sm:hidden text-[11px] text-primary font-bold border border-primary/20 rounded-md px-2 py-0.5 bg-primary/5 uppercase tracking-wider mb-3">
                  {expandedCards.planAdherence ? "Hide" : "Show"}
                </span>
              </div>
              <div className={`${expandedCards.planAdherence ? "block" : "hidden sm:block"} grid grid-cols-3 gap-4 sm:gap-8 py-4 sm:py-8 mt-2 sm:mt-4`}>
                <div className="text-center">
                  <p className="text-2xl sm:text-4xl font-bold text-emerald-500">{planQuery.data?.adherence?.completed ?? 0}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl sm:text-4xl font-bold text-orange-500">{planQuery.data?.adherence?.skipped ?? 0}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Skipped</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl sm:text-4xl font-bold text-muted-foreground">{planQuery.data?.adherence?.pending ?? 0}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Pending</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => toggleCard("consistency")}
              className="card-surface p-4 sm:p-6 cursor-pointer sm:cursor-default"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <SectionHeader title="Consistency" icon={Zap} />
                </div>
                <span className="sm:hidden text-[11px] text-primary font-bold border border-primary/20 rounded-md px-2 py-0.5 bg-primary/5 uppercase tracking-wider mb-3">
                  {expandedCards.consistency ? "Hide" : "Show"}
                </span>
              </div>
              <div className={`${expandedCards.consistency ? "block" : "hidden sm:block"} space-y-4 sm:space-y-6 mt-2 sm:mt-4`}>
                <div className="text-center p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-primary/5 border border-primary/20">
                  <p className="text-3xl sm:text-5xl font-bold text-primary">{planQuery.data?.currentStreak}</p>
                  <p className="text-xs font-bold text-primary/70 uppercase mt-1">Day Streak</p>
                </div>
                <div className="flex justify-between items-center text-xs pt-2">
                  <span className="text-muted-foreground">Overdue Tasks</span>
                  <span className="font-bold text-red-500">{planQuery.data?.overdueItemsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Side-by-Side summaries */}
      <div className="flex flex-row flex-nowrap overflow-x-auto scrollbar-none gap-4 pb-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:pb-0">
        {/* 1. Performance Summary */}
        {(() => {
          const score = insights?.readinessScore ?? 0;
          const status = insights?.status ?? "on_track";
          const trend = insights?.performanceTrend ?? "stable";
          const weakCount = insights?.weakTopicCount ?? 0;
          const consistency = insights?.consistencyScore ?? 0;
          const topics = perfQuery.data?.topicPerformance ?? [];
          const weakest = [...topics].sort((a, b) => a.accuracy - b.accuracy)[0];
          const statusMsg =
            status === "at_risk" ? "You are at risk of falling behind" :
              status === "warning" ? "You need to pick up the pace" :
                status === "thriving" ? "You are excelling" :
                  "You are on track";
          const trendMsg =
            trend === "improving" ? "Your performance is improving — keep it up." :
              trend === "declining" ? "Your performance has been declining — focus is needed." :
                "Your performance has been stable.";
          if (!score && !weakCount && !weakest) return null;
          return (
            <div className="card-surface p-5 border-primary/20 bg-primary/5 rounded-2xl sm:rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[200px] sm:min-h-[220px] w-[88vw] sm:w-auto shrink-0">
              <div className="absolute top-0 right-0 p-5 opacity-[0.07]">
                <ShieldCheck className="w-20 h-20 sm:w-24 sm:h-24 text-primary" />
              </div>
              <div className="relative z-10 space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-foreground">Performance Summary</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {statusMsg} with a readiness score of{" "}
                  <span className="font-bold text-foreground">{score}%</span>.{" "}
                  {trendMsg}{" "}
                  {weakCount > 0 && (
                    <>You have{" "}
                      <span className="font-bold text-foreground">{weakCount} weak topic{weakCount > 1 ? "s" : ""}</span>{" "}
                      {weakest ? <>— the lowest is <span className="font-bold text-foreground">{weakest.topicName}</span> at <span className="font-bold text-foreground">{weakest.accuracy.toFixed(0)}% accuracy</span>.</> : "that need attention."}
                    </>
                  )}
                  {consistency > 0 && <> Your consistency score is <span className="font-bold text-foreground">{consistency}%</span>.</>}
                </p>
              </div>
              <div className="relative z-10 flex gap-3 pt-4">
                {weakCount > 0 && aiPlanEnabled && (
                  <button onClick={() => navigate("/student/study-plan")}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow shadow-primary/20 hover:scale-105 transition-transform">
                    Fix Weak Topics
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("syllabus")}
                  className="px-4 py-2 rounded-xl border border-primary/20 text-primary text-xs sm:text-sm font-bold hover:bg-primary/5 transition-colors">
                  View Topic Breakdown
                </button>
              </div>
            </div>
          );
        })()}

        {/* 2. AI Performance Insights */}
        {(() => {
          const score = insights?.readinessScore ?? 0;
          const trend = insights?.performanceTrend ?? "stable";
          const topics = perfQuery.data?.topicPerformance ?? [];
          const weakest = [...topics].sort((a, b) => a.accuracy - b.accuracy)[0];
          const mistakes = perfQuery.data?.mistakePatterns ?? [];
          const topMistake = mistakes.length > 0 ? mistakes.reduce((a, b) => a.count > b.count ? a : b) : null;

          const trendMsg =
            trend === "improving" ? "you are on track for your target exam" :
            trend === "declining" ? "you need to pick up the pace for your target exam" :
              "you are holding steady for your target exam";

          const focusArea = topMistake
            ? `Your most frequent error type is ${topMistake.type} (${topMistake.count} occurrences).`
            : weakest
              ? `Focus on "${weakest.topicName}" where your accuracy is ${weakest.accuracy.toFixed(0)}%.`
              : "Keep practicing to build your performance profile.";

          return (
            <div className="card-surface p-5 border-primary/20 bg-primary/5 rounded-2xl sm:rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[200px] sm:min-h-[220px] w-[88vw] sm:w-auto shrink-0">
              <div className="absolute top-0 right-0 p-5 opacity-10">
                <ShieldCheck className="w-20 h-20 sm:w-24 sm:h-24 text-primary" />
              </div>
              <div className="relative z-10 space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-foreground">AI Performance Insights</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Based on your current readiness score of <span className="font-bold text-foreground">{score}%</span>,{" "}
                  {trendMsg}. {focusArea}
                </p>
              </div>
              <div className="relative z-10 flex gap-3 pt-4">
                <button
                  onClick={() => navigate("/student/study-plan")}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  Fix Weak Topics
                </button>
                <button
                  onClick={() => setActiveTab("syllabus")}
                  className="px-4 py-2 rounded-xl border border-primary/20 text-primary text-xs sm:text-sm font-bold hover:bg-primary/5 transition-colors">
                  View Topic Breakdown
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* --- Modals --- */}

      <Dialog open={showWeakTopics} onOpenChange={setShowWeakTopics}>
        <DialogContent className="w-[92%] max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl sm:rounded-[2rem]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <Brain className="w-6 h-6 text-primary" />
              Weak Topic Analysis
            </DialogTitle>
            <DialogDescription className="font-medium text-sm">
              Focus on these topics to rapidly improve your overall percentile.
            </DialogDescription>
          </DialogHeader>

          {fullPerfQuery.isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Analyzing your data...</p>
            </div>
          ) : weakTopics.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto opacity-20" />
              <p className="font-bold text-slate-400">No critical weak topics identified yet!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weakTopics.map((wt) => (
                <div key={wt.id} className="p-5 rounded-3xl border border-border bg-muted/20 space-y-4 hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground leading-tight">{wt.topic.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                        {wt.topic.chapter?.subject?.name} • {wt.topic.chapter?.name}
                      </p>
                    </div>
                    <Badge variant={wt.severity > 7 ? "destructive" : "warning"} className="text-[10px] font-black uppercase h-5">
                      {wt.severity > 7 ? "Critical" : "Improvement"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-xl bg-background/50 border border-border/50">
                      <p className="text-xs font-black text-foreground">{wt.accuracy}%</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Accuracy</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-background/50 border border-border/50">
                      <p className="text-xs font-black text-foreground">{wt.errorCount}</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Errors</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-background/50 border border-border/50">
                      <p className="text-xs font-black text-foreground">{wt.timeErrors}</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Time Exp</p>
                    </div>
                  </div>

                  <Button
                    className="w-full rounded-2xl h-10 text-xs font-bold"
                    onClick={() => {
                      setShowWeakTopics(false);
                      navigate(`/student/learn/topic/${wt.topicId}`);
                    }}
                  >
                    Launch Fix
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMistake} onOpenChange={(open) => !open && setSelectedMistake(null)}>
        <DialogContent className="w-[92%] max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl sm:rounded-[2rem]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <Zap className="w-6 h-6 text-primary animate-pulse" />
              {selectedMistake?.type} Topics
            </DialogTitle>
            <DialogDescription className="font-medium text-sm">
              List of topics where this type of error was identified.
            </DialogDescription>
          </DialogHeader>

          {fullPerfQuery.isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Analyzing mistake areas...</p>
            </div>
          ) : ((() => {
            const type = selectedMistake?.type?.toLowerCase() ?? "";
            const filteredTopics = weakTopics.filter(wt => {
              if (type.includes("concept") || type.includes("gap")) return wt.conceptualErrors > 0;
              if (type.includes("silly") || type.includes("guess") || type.includes("careless")) return wt.sillyErrors > 0;
              if (type.includes("time") || type.includes("pressure")) return wt.timeErrors > 0;
              return wt.errorCount > 0;
            });

            if (filteredTopics.length === 0) {
              return (
                <div className="py-20 text-center space-y-4">
                  <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto opacity-20" />
                  <p className="font-bold text-slate-400">No weak topics found for this mistake type!</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTopics.map((wt) => {
                  let errorVal = wt.errorCount;
                  if (type.includes("concept") || type.includes("gap")) errorVal = wt.conceptualErrors;
                  else if (type.includes("silly") || type.includes("guess") || type.includes("careless")) errorVal = wt.sillyErrors;
                  else if (type.includes("time") || type.includes("pressure")) errorVal = wt.timeErrors;

                  return (
                    <div key={wt.id} className="p-5 rounded-3xl border border-border bg-muted/20 flex flex-col justify-between hover:border-primary/30 transition-colors">
                      <div className="space-y-1">
                        <h4 className="font-bold text-foreground leading-tight">{wt.topic.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                          {wt.topic.chapter?.subject?.name} • {wt.topic.chapter?.name}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                        <div>
                          <p className="text-xs font-black text-foreground">{errorVal} error{errorVal !== 1 ? "s" : ""}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Accuracy: {wt.accuracy}%</p>
                        </div>
                        <Button
                          className="rounded-2xl h-10 text-xs font-bold px-4"
                          onClick={() => {
                            setSelectedMistake(null);
                            navigate(`/student/learn/topic/${wt.topicId}`);
                          }}
                        >
                          Practice Topic
                          <ArrowRight className="w-3.5 h-3.5 ml-2" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })())}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedInsight} onOpenChange={(open) => !open && setSelectedInsight(null)}>
        <DialogContent className="w-[90%] max-w-lg rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-6">
          <DialogHeader className="mb-4 sm:mb-6">
            <DialogTitle className="text-xl sm:text-2xl font-black">{selectedInsight}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm font-medium">
              Detailed breakdown of your {selectedInsight?.toLowerCase()} metrics.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {selectedInsight === "Readiness Score" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-3xl sm:text-5xl font-black text-emerald-600 mb-1 sm:mb-2">{insights?.readinessScore}%</p>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-700">Exam Ready</p>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {(() => {
                    const scoreTrend = perfQuery.data?.scoreTrend ?? [];
                    const subjectAcc = perfQuery.data?.subjectAccuracy ?? {};
                    const subjectValues = Object.values(subjectAcc).filter((v): v is number => typeof v === 'number');
                    const avgSubjectAcc = subjectValues.length > 0 ? Math.round(subjectValues.reduce((a, b) => a + b, 0) / subjectValues.length) : 0;
                    const topicCount = perfQuery.data?.topicPerformance?.length ?? 0;
                    const masteredCount = (perfQuery.data?.topicPerformance ?? []).filter(t => t.accuracy >= 70).length;
                    const syllabusPct = topicCount > 0 ? Math.round((masteredCount / topicCount) * 100) : 0;
                    return (
                      <>
                        <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/50">
                          <span className="text-xs sm:text-sm font-bold">Syllabus Coverage</span>
                          <Badge variant="outline" className="font-black text-xs">{syllabusPct}%</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/50">
                          <span className="text-xs sm:text-sm font-bold">Avg Subject Accuracy</span>
                          <Badge variant="outline" className="font-black text-xs">{avgSubjectAcc}%</Badge>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {selectedInsight === "Performance Trend" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-primary/10 border border-primary/20 text-center">
                  {insights?.performanceTrend === 'improving' ? <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-500 mx-auto mb-3 sm:mb-4" /> :
                    insights?.performanceTrend === 'declining' ? <TrendingDown className="w-8 h-8 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" /> :
                      <Minus className="w-8 h-8 sm:w-12 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />}
                  <p className="text-2xl sm:text-3xl font-black text-foreground mb-1 uppercase tracking-tighter">{insights?.performanceTrend}</p>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Velocity Index</p>
                </div>
                {(() => {
                  const scoreTrend = perfQuery.data?.scoreTrend ?? [];
                  if (scoreTrend.length < 2) return <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">Not enough assessment data to compute a trend yet. Take more quizzes!</p>;
                  const first = scoreTrend[0].score;
                  const last = scoreTrend[scoreTrend.length - 1].score;
                  const delta = last - first;
                  const direction = delta > 0 ? 'increased' : delta < 0 ? 'decreased' : 'stayed the same';
                  return (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                      Your accuracy has {direction} by <span className={`font-bold ${delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{Math.abs(delta)}%</span> over your last {scoreTrend.length} assessment sessions. {delta >= 0 ? 'Keep up the current study velocity!' : 'Focus on your weak topics to reverse the trend.'}
                    </p>
                  );
                })()}
              </div>
            )}

            {selectedInsight === "Consistency" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-orange-500/10 border border-orange-500/20 text-center">
                  <p className="text-3xl sm:text-5xl font-black text-orange-600 mb-1 sm:mb-2">{insights?.consistencyScore}%</p>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-orange-700">Platform Adherence</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/50">
                    <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase mb-1">Daily Streak</p>
                    <p className="text-base sm:text-xl font-black text-foreground">{planQuery.data?.currentStreak ?? 0} Days</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/50">
                    <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase mb-1">Avg Focus</p>
                    <p className="text-base sm:text-xl font-black text-foreground">
                      {(() => {
                        const mins = engageQuery.data?.dailyActiveMinutes ?? [];
                        if (mins.length === 0) return '—';
                        const avg = Math.round(mins.reduce((acc: number, m: any) => acc + (m.minutes || 0), 0) / mins.length);
                        return `${avg} min`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button className="w-full h-10 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm" onClick={() => setSelectedInsight(null)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
