// AreaOfImprovement — single consolidated, ranked view of where the school
// needs attention: weak sections, weak subjects, teacher-level gaps (low
// attendance / behind on syllabus), and fee collection health by section.
// Worst-first everywhere, rendered as a distinct analytics chart per
// section (area / radar / bar / radial gauge), with click-through to the
// relevant page. Palette is deliberately red-free — severity is conveyed
// through the EDDVA blue/violet/amber/emerald family only.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Users, BookOpen, GraduationCap, IndianRupee, CheckCircle2, TrendingUp, BarChart3, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  LabelList,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import api from '@/lib/api/school-client';
import { cn } from '@/lib/utils';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/school/LoadingSpinner';

// ─── Red-free EDDVA analytics palette — severity is shade, not hue ──
const EDDVA_BLUE = '#013889';
const VIOLET = '#8B5CF6';
const TEAL = '#0D9488';
const AMBER = '#D97706'; // moderate concern
const AMBER_DARK = '#92400E'; // severe concern
const EMERALD = '#10B981'; // healthy
const TRACK = '#E2E8F0';

function toneHex(pct, threshold) {
  if (pct == null) return '#94A3B8';
  if (pct < threshold - 10) return AMBER_DARK;
  if (pct < threshold) return AMBER;
  return EMERALD;
}

function SectionCard({ icon: Icon, iconBg, iconColor, title, description, count, children }) {
  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
            <Icon className={cn('w-4.5 h-4.5', iconColor)} />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">{title}</CardTitle>
            <CardDescription className="text-xs font-semibold text-slate-400 truncate">{description}</CardDescription>
          </div>
        </div>
        {count > 0 && (
          <span className="shrink-0 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[11px] font-bold px-2.5 py-1">
            {count} flagged
          </span>
        )}
      </div>
      {children}
    </Card>
  );
}

function EmptyState({ label }) {
  return (
    <div className="py-10 flex flex-col items-center justify-center text-center">
      <CheckCircle2 className="w-9 h-9 text-emerald-500 mb-2" />
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</p>
    </div>
  );
}

const chartConfig = {
  attendance: { label: 'Attendance', color: EDDVA_BLUE },
  score: { label: 'Avg. score', color: VIOLET },
};

const trendChartConfig = {
  attendance: { label: 'Attendance', color: EDDVA_BLUE },
  score: { label: 'Avg. score', color: VIOLET },
  fee: { label: 'Fee collection', color: TEAL },
};

function downloadCsvReport({ weakSections, weakSubjects, teacherGaps, feeHealth, trends }) {
  const lines = [];
  lines.push('Area of Improvement Report');
  lines.push(`Generated,${new Date().toLocaleString()}`);
  lines.push('');
  lines.push('Weak Sections');
  lines.push('Class/Section,Attendance %,Avg Score %');
  weakSections.forEach((s) => lines.push(`${s.className}/${s.sectionName},${s.attendancePct},${s.avgScore ?? ''}`));
  lines.push('');
  lines.push('Weak Subjects');
  lines.push('Subject,Avg Score %,Students Below 50%');
  weakSubjects.forEach((s) => lines.push(`${s.subjectName},${s.avgScore},${s.studentsBelowThreshold}`));
  lines.push('');
  lines.push('Teacher Gaps');
  lines.push('Teacher,Attendance % (30d),Behind Syllabus Plans');
  teacherGaps.forEach((t) => lines.push(`${t.name},${t.attendancePct ?? ''},${t.behindSyllabusCount}`));
  lines.push('');
  lines.push('Fee Collection Health');
  lines.push(`School-wide Collection Rate %,${feeHealth.schoolCollectionRatePct}`);
  lines.push('Class/Section,Collection Rate %,Overdue Accounts,Overdue Amount');
  (feeHealth.bySection || []).forEach((s) => lines.push(`${s.className}/${s.sectionName},${s.collectionRatePct ?? ''},${s.overdueAccounts},${s.overdueAmount}`));
  lines.push('');
  lines.push('6-Month Trend');
  lines.push('Month,Attendance %,Avg Score %,Fee Collection %');
  (trends || []).forEach((t) => lines.push(`${t.month},${t.attendancePct ?? ''},${t.avgScorePct ?? ''},${t.feeCollectionRatePct ?? ''}`));

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `area-of-improvement-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AreaOfImprovement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    api.get('/improvement-areas')
      .then((res) => { if (alive) setData(res?.data || {}); })
      .catch((err) => { console.error(err); toast.error('Failed to load improvement areas'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <LoadingSpinner />;

  const threshold = data?.attendanceThreshold ?? 75;
  const weakSections = data?.weakSections || [];
  const weakSubjects = data?.weakSubjects || [];
  const teacherGaps = data?.teacherGaps || [];
  const feeHealth = data?.feeHealth || { schoolCollectionRatePct: 0, bySection: [] };
  const trends = data?.trends || [];
  const rankings = data?.rankings || { sections: [], subjects: [], teachers: [] };

  const trendChartData = trends.map((t) => ({ month: t.month, attendance: t.attendancePct, score: t.avgScorePct, fee: t.feeCollectionRatePct }));
  const rankSectionsData = (rankings.sections || []).slice(0, 15).map((s) => ({ name: `${s.className}/${s.sectionName}`, value: s.attendancePct, isWeak: s.isWeak }));
  const rankSubjectsData = (rankings.subjects || []).slice(0, 15).map((s) => ({ name: s.subjectName, value: s.avgScore, isWeak: s.isWeak }));
  const rankTeachersData = (rankings.teachers || []).slice(0, 15).map((t) => ({ name: t.name, value: t.attendancePct, isWeak: t.isWeak }));

  // Weak Sections — area chart: attendance vs avg. score per section.
  const sectionsChartData = weakSections.map((s) => ({
    name: `${s.className}/${s.sectionName}`,
    attendance: s.attendancePct,
    score: s.avgScore,
    classId: s.classId,
  }));

  // Weak Subjects — radar chart across all flagged subjects.
  const subjectsChartData = weakSubjects.map((s) => ({
    name: s.subjectName,
    score: s.avgScore,
    below: s.studentsBelowThreshold,
    threshold: 60,
  }));

  // Teacher Gaps — horizontal bar, attendance %, with a behind-syllabus label.
  const teacherChartData = teacherGaps.map((t, i) => ({
    name: t.name,
    attendance: t.attendancePct,
    behind: t.behindSyllabusCount,
    teacherUserId: t.teacherUserId,
    key: t.teacherUserId || `${t.name}-${i}`,
  }));

  // Fee Health — radial gauge for the school-wide rate + horizontal bars for the 10 worst sections.
  const feeGaugeData = [{ name: 'Rate', value: feeHealth.schoolCollectionRatePct, fill: EDDVA_BLUE }];
  const feeBySectionData = (feeHealth.bySection || []).slice(0, 10).map((s) => ({
    name: `${s.className}/${s.sectionName}`,
    rate: s.collectionRatePct,
    overdueAccounts: s.overdueAccounts,
    overdueAmount: s.overdueAmount,
  }));

  return (
    <div className="w-full space-y-5 font-poppins">
      <div className="flex items-center gap-3 rounded-2xl p-5 text-white shadow-lg" style={{ background: `linear-gradient(90deg, ${EDDVA_BLUE}, ${VIOLET})` }}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 shrink-0">
          <AlertCircle size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black">Area of Improvement</h1>
          <p className="text-sm text-blue-50">Where the school needs attention — worst first.</p>
        </div>
        <div className="flex items-center gap-2 no-print shrink-0">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/15 hover:bg-white/25 text-white border-0 gap-1.5"
            onClick={() => downloadCsvReport({ weakSections, weakSubjects, teacherGaps, feeHealth, trends })}
          >
            <Download className="w-3.5 h-3.5" /> Download
          </Button>
          <Button size="sm" variant="secondary" className="bg-white/15 hover:bg-white/25 text-white border-0 gap-1.5" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
        </div>
      </div>

      {/* 6-month trend — line chart */}
      <SectionCard
        icon={TrendingUp}
        iconBg="bg-blue-50 dark:bg-blue-950/40"
        iconColor="text-[#013889]"
        title="6-Month Trend"
        description="Attendance, avg. score and fee collection, school-wide"
        count={0}
      >
        {trendChartData.length > 1 ? (
          <ChartContainer config={trendChartConfig} className="h-[240px] w-full aspect-auto">
            <LineChart accessibilityLayer data={trendChartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} fontSize={11} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} unit="%" fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line dataKey="attendance" name="attendance" type="monotone" stroke="var(--color-attendance)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              <Line dataKey="score" name="score" type="monotone" stroke="var(--color-score)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              <Line dataKey="fee" name="fee" type="monotone" stroke="var(--color-fee)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ChartContainer>
        ) : (
          <EmptyState label="Not enough historical data yet to chart a trend." />
        )}
      </SectionCard>

      {/* Weak Sections — area chart */}
      <SectionCard
        icon={GraduationCap}
        iconBg="bg-blue-50 dark:bg-blue-950/40"
        iconColor="text-[#013889]"
        title="Weak Sections"
        description={`Below ${threshold}% attendance or 60% avg. score, last 30 days`}
        count={weakSections.length}
      >
        {sectionsChartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[260px] w-full aspect-auto">
            <AreaChart
              accessibilityLayer
              data={sectionsChartData}
              margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
              className="cursor-pointer"
              onClick={(e) => { const cid = e?.activePayload?.[0]?.payload?.classId; if (cid) navigate(`/school/admin/academics/${cid}/sections`); }}
            >
              <defs>
                <linearGradient id="gradAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EDDVA_BLUE} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={EDDVA_BLUE} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={VIOLET} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={VIOLET} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} fontSize={11} />
              <YAxis axisLine={false} tickLine={false} domain={[0, 100]} unit="%" fontSize={11} />
              <ReferenceLine y={threshold} stroke={AMBER} strokeDasharray="4 4" />
              <ReferenceLine y={60} stroke={TEAL} strokeDasharray="4 4" />
              <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground">{name === 'attendance' ? 'Attendance' : 'Avg. score'}</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">{value}%</span>
                </div>
              )} />} />
              <Area type="monotone" dataKey="attendance" name="attendance" stroke={EDDVA_BLUE} strokeWidth={2.5} fill="url(#gradAttendance)" dot={{ r: 3 }} />
              <Area type="monotone" dataKey="score" name="score" stroke={VIOLET} strokeWidth={2.5} fill="url(#gradScore)" dot={{ r: 3 }} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <EmptyState label="No sections flagged — attendance and scores are healthy." />
        )}
      </SectionCard>

      {/* Weak Subjects — radar chart */}
      <SectionCard
        icon={BookOpen}
        iconBg="bg-teal-50 dark:bg-teal-950/40"
        iconColor="text-teal-600"
        title="Weak Subjects"
        description="Below 60% average score, school-wide"
        count={weakSubjects.length}
      >
        {subjectsChartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[280px] w-full aspect-auto">
            <RadarChart data={subjectsChartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <PolarGrid stroke="#CBD5E1" />
              <PolarAngleAxis dataKey="name" fontSize={11} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={5} fontSize={10} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value, _name, item) => (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Avg. score</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">{value}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Below 50%</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">{item?.payload?.below ?? 0}</span>
                  </div>
                </div>
              )} />} />
              <Radar name="score" dataKey="score" stroke={TEAL} fill={TEAL} fillOpacity={0.35} strokeWidth={2} />
              <Radar name="threshold" dataKey="threshold" stroke={AMBER} fill="none" strokeDasharray="4 4" strokeWidth={1.5} />
            </RadarChart>
          </ChartContainer>
        ) : (
          <EmptyState label="No subjects flagged — all averaging above 60%." />
        )}
      </SectionCard>

      {/* Teacher Gaps — horizontal bar chart */}
      <SectionCard
        icon={Users}
        iconBg="bg-violet-50 dark:bg-violet-950/40"
        iconColor="text-violet-600"
        title="Teacher Gaps"
        description={`Below ${threshold}% attendance, or classes behind on syllabus`}
        count={teacherGaps.length}
      >
        {teacherChartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="w-full aspect-auto" style={{ height: Math.max(180, teacherChartData.length * 40) }}>
            <BarChart accessibilityLayer data={teacherChartData} layout="vertical" margin={{ top: 10, right: 40, left: 8, bottom: 0 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" domain={[0, 100]} unit="%" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={11} width={110} />
              <ReferenceLine x={threshold} stroke={AMBER} strokeDasharray="4 4" />
              <ChartTooltip content={<ChartTooltipContent formatter={(value, _name, item) => (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Attendance (30d)</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">{value != null ? `${value}%` : '—'}</span>
                  </div>
                  {item?.payload?.behind > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Behind syllabus</span>
                      <span className="font-mono font-medium tabular-nums text-foreground">{item.payload.behind} plan{item.payload.behind > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              )} />} />
              <Bar dataKey="attendance" radius={[0, 6, 6, 0]} style={{ cursor: 'pointer' }}
                onClick={(d) => d?.teacherUserId && navigate(`/school/admin/teachers/${d.teacherUserId}`)}>
                {teacherChartData.map((t, i) => <Cell key={i} fill={t.attendance != null ? toneHex(t.attendance, threshold) : '#94A3B8'} />)}
                <LabelList dataKey="behind" position="right" formatter={(v) => (v > 0 ? `+${v} plan${v > 1 ? 's' : ''}` : '')} fontSize={10} fontWeight={700} fill={VIOLET} />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <EmptyState label="No teacher gaps — attendance and syllabus pacing are on track." />
        )}
      </SectionCard>

      {/* Fee Collection Health — radial gauge + horizontal bars */}
      <SectionCard
        icon={IndianRupee}
        iconBg="bg-blue-50 dark:bg-blue-950/40"
        iconColor="text-[#013889]"
        title="Fee Collection Health"
        description={`School-wide collection rate: ${feeHealth.schoolCollectionRatePct}%`}
        count={feeHealth.bySection.length}
      >
        {feeBySectionData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 items-center">
            <div className="relative">
              <ChartContainer config={chartConfig} className="h-[180px] w-full aspect-auto">
                <RadialBarChart data={feeGaugeData} innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} barSize={14}>
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill: TRACK }} fill={EDDVA_BLUE} />
                </RadialBarChart>
              </ChartContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-xl font-black text-slate-900 dark:text-white">{feeHealth.schoolCollectionRatePct}%</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Collected</span>
              </div>
            </div>
            <ChartContainer config={chartConfig} className="w-full aspect-auto" style={{ height: Math.max(160, feeBySectionData.length * 34) }}>
              <BarChart accessibilityLayer data={feeBySectionData} layout="vertical" margin={{ top: 10, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={11} width={80} />
                <ReferenceLine x={80} stroke={AMBER} strokeDasharray="4 4" />
                <ChartTooltip content={<ChartTooltipContent formatter={(value, _name, item) => (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Collection rate</span>
                      <span className="font-mono font-medium tabular-nums text-foreground">{value != null ? `${value}%` : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Overdue accounts</span>
                      <span className="font-mono font-medium tabular-nums text-foreground">{item?.payload?.overdueAccounts ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Overdue amount</span>
                      <span className="font-mono font-medium tabular-nums text-foreground">₹{Number(item?.payload?.overdueAmount ?? 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )} />} />
                <Bar dataKey="rate" radius={[0, 6, 6, 0]} style={{ cursor: 'pointer' }} onClick={() => navigate('/school/admin/fee-defaulters')}>
                  {feeBySectionData.map((s, i) => <Cell key={i} fill={toneHex(s.rate, 80)} />)}
                  <LabelList dataKey="rate" position="right" formatter={(v) => `${v}%`} fontSize={11} fontWeight={700} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        ) : (
          <EmptyState label="No sections flagged for fee collection." />
        )}
      </SectionCard>

      {/* Full comparative rankings — every section/subject/teacher, not just the flagged ones */}
      <SectionCard
        icon={BarChart3}
        iconBg="bg-violet-50 dark:bg-violet-950/40"
        iconColor="text-violet-600"
        title="Full Rankings"
        description="Every section, subject and teacher side-by-side — worst 15 of each"
        count={0}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <RankingColumn label="Sections — attendance %" data={rankSectionsData} />
          <RankingColumn label="Subjects — avg. score %" data={rankSubjectsData} />
          <RankingColumn label="Teachers — attendance %" data={rankTeachersData} />
        </div>
      </SectionCard>

      <style>{`@media print {
        .no-print { display: none !important; }
      }`}</style>
    </div>
  );
}

function RankingColumn({ label, data }) {
  if (!data.length) return <EmptyState label="No data available." />;
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{label}</p>
      <ChartContainer config={chartConfig} className="w-full aspect-auto" style={{ height: Math.max(140, data.length * 26) }}>
        <BarChart accessibilityLayer data={data} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 0 }}>
          <XAxis type="number" domain={[0, 100]} unit="%" tickLine={false} axisLine={false} fontSize={10} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={10} width={92} />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => (
            <span className="font-mono font-medium tabular-nums text-foreground">{value != null ? `${value}%` : '—'}</span>
          )} />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.isWeak ? AMBER : EMERALD} />)}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
