import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Users, GraduationCap, Search } from 'lucide-react';
import StatCard from '@/components/school/StatCard';
import api from '@/lib/api/school-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TONES = {
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
} as const;

const ToneBadge: React.FC<{ tone: keyof typeof TONES; children: React.ReactNode }> = ({ tone, children }) => (
  <Badge variant="outline" className={`border-transparent font-semibold ${TONES[tone]}`}>{children}</Badge>
);

const scoreTone = (v: number): keyof typeof TONES => (v >= 85 ? 'success' : v >= 70 ? 'info' : v >= 40 ? 'warning' : 'danger');

const TREND_CLASS: Record<string, string> = {
  improving: 'text-emerald-600',
  declining: 'text-red-600',
  consistent: 'text-blue-500',
};

const WeaknessDetails: React.FC = () => {
  const { topic } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [studentPerformance, setStudentPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract navigation state if passed
  const stateData = location.state as {
    studentPerformance?: any[];
    classId?: string;
    sectionId?: string;
    subjectId?: string;
    subjectName?: string;
  } | null;

  useEffect(() => {
    const loadData = async () => {
      if (stateData?.studentPerformance) {
        setStudentPerformance(stateData.studentPerformance);
        setLoading(false);
      } else {
        try {
          setLoading(true);
          setError('');
          const res = await api.get('/reports/class');
          const body: any = res.data || {};
          setStudentPerformance(Array.isArray(body.students) ? body.students : []);
        } catch (err: any) {
          console.error('Error fetching reports for weakness analysis:', err);
          setError('Unable to load weakness details right now.');
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [stateData]);

  const scopedStudents = studentPerformance.filter((student) => {
    const matchesClass = !stateData?.classId || String(student.classId) === String(stateData.classId);
    const matchesSection = !stateData?.sectionId || String(student.sectionId) === String(stateData.sectionId);
    return matchesClass && matchesSection;
  });

  // Filter students who are weak in this subject (topic)
  const topicKey = String(topic || '').trim().toLowerCase();
  const weakStudents = scopedStudents.filter((student) => {
    const areas = Array.isArray(student.weakAreas) ? student.weakAreas : [];
    return areas.some((area: any) => {
      // Match by subject id first — the same subject can exist as more than
      // one row in `subjects` (e.g. legacy "Maths" vs "Mathematics"), so a
      // name-only match can miss a real weak area.
      if (area && typeof area === 'object') {
        if (stateData?.subjectId && area.subjectId) return String(area.subjectId) === String(stateData.subjectId);
        return String(area.name || '').trim().toLowerCase() === topicKey;
      }
      return String(area || '').trim().toLowerCase() === topicKey;
    });
  });

  // Filter based on search query
  const filteredWeakStudents = weakStudents.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalClassStudents = scopedStudents.length || 1;
  const weakCount = weakStudents.length;
  const percentageAtRisk = Math.round((weakCount / totalClassStudents) * 100);
  const classAverageScore = Math.round(
    scopedStudents.reduce((acc, curr) => acc + (curr.avgScore || 0), 0) / totalClassStudents,
  );
  // StatCard only supports positive/negative/neutral tones — band the class
  // average into one instead of the invalid "info" value it silently ignored.
  const classAverageTone: 'positive' | 'negative' | 'neutral' =
    classAverageScore >= 70 ? 'positive' : classAverageScore >= 40 ? 'neutral' : 'negative';

  const strongAreaTags = (v: any) =>
    Array.isArray(v) && v.length > 0 ? (
      v.map((a) => {
        const label = a && typeof a === 'object' ? a.name : a;
        const key = a && typeof a === 'object' ? (a.subjectId || a.name) : a;
        return <ToneBadge key={key} tone="success">{label}</ToneBadge>;
      })
    ) : (
      <span className="text-xs text-slate-400">-</span>
    );

  const trendLabel = (v: string) => (
    <span className={`text-xs font-semibold capitalize ${TREND_CLASS[v] || 'text-slate-500'}`}>{v}</span>
  );

  return (
    <div className="w-full space-y-5 font-poppins">
      {/* Header with Back button */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          onClick={() => navigate('/school/teacher/reports')}
          className="h-auto gap-1 p-0 text-sm font-semibold text-slate-600 hover:bg-transparent hover:text-blue-600 dark:text-slate-300"
        >
          <ChevronLeft size={18} />
          Back to Reports
        </Button>
        <div className="space-y-1">
          <h1 className="break-words text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{topic} Analysis</h1>
          <p className="text-sm text-slate-500">Detailed breakdown of students requiring support in {topic}.</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-5" aria-busy="true" aria-label="Analyzing records">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="At-Risk Students"
              value={String(weakCount)}
              change={`${percentageAtRisk}% of class`}
              changeType="negative"
              icon={<AlertTriangle size={24} />}
              gradient="var(--gradient-warm)"
            />
            <StatCard
              title="Class Average"
              value={`${classAverageScore}%`}
              change="Overall"
              changeType={classAverageTone}
              icon={<GraduationCap size={24} />}
            />
            <div className="sm:col-span-2 lg:col-span-1">
              <StatCard
                title="Assigned Students"
                value={String(scopedStudents.length)}
                change="Total Class"
                changeType="positive"
                icon={<Users size={24} />}
                gradient="var(--gradient-accent)"
              />
            </div>
          </div>

          {/* Weak Students */}
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="flex-col gap-3 space-y-0 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-base font-bold tracking-normal">Struggling Students</CardTitle>
                <CardDescription>Listed students scored below 60% average in {topic}.</CardDescription>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredWeakStudents.length > 0 ? (
                <>
                  {/* Phones: one card per student */}
                  <div className="space-y-3 p-4 pt-0 md:hidden">
                    {filteredWeakStudents.map((student, i) => (
                      <Card key={student.id ?? i} className="space-y-3 rounded-xl border-slate-200 p-4 shadow-none dark:border-slate-800">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">{student.name}</p>
                          <ToneBadge tone="purple">{student.class}</ToneBadge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                            <p className="text-[10px] font-semibold uppercase text-slate-500">Average</p>
                            <div className="mt-1"><ToneBadge tone={scoreTone(student.avgScore)}>{student.avgScore}%</ToneBadge></div>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                            <p className="text-[10px] font-semibold uppercase text-slate-500">Attendance</p>
                            <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{student.attendance}%</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                            <p className="text-[10px] font-semibold uppercase text-slate-500">Trend</p>
                            <p className="mt-1">{trendLabel(student.trend)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Strong Areas</p>
                          <div className="flex flex-wrap gap-1.5">{strongAreaTags(student.strongAreas)}</div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Tablet / desktop: table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-6">Student Name</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Overall Average</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>Trend</TableHead>
                          <TableHead className="pr-6">Strong Areas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWeakStudents.map((student, i) => (
                          <TableRow key={student.id ?? i}>
                            <TableCell className="px-6 font-semibold text-slate-900 dark:text-white">{student.name}</TableCell>
                            <TableCell><ToneBadge tone="purple">{student.class}</ToneBadge></TableCell>
                            <TableCell><ToneBadge tone={scoreTone(student.avgScore)}>{student.avgScore}%</ToneBadge></TableCell>
                            <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-300">{student.attendance}%</TableCell>
                            <TableCell>{trendLabel(student.trend)}</TableCell>
                            <TableCell className="pr-6">
                              <div className="flex flex-wrap gap-1.5">{strongAreaTags(student.strongAreas)}</div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="m-4 mt-0 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 sm:m-6 sm:mt-0">
                  {searchQuery ? 'No matching students found.' : `Great news! No students are currently flagged as weak in ${topic}.`}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default WeaknessDetails;
