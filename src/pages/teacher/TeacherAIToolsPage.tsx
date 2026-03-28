import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, BookOpen, Mic, MessageSquare, BarChart3,
  Loader2, AlertCircle, CheckCircle, ChevronDown, ChevronUp,
  Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGradeSubjective,
  useDetectEngagement,
  useGenerateLectureNotes,
  useGenerateFeedback,
  useAnalyzePerformance,
} from "@/hooks/use-teacher";
import type {
  GradeSubjectiveResult,
  EngagementDetectResult,
  SttNotesResult,
  FeedbackGenerateResult,
  PerformanceAnalyzeResult,
} from "@/lib/api/teacher";

// ─── Shared helpers ────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold text-muted-foreground uppercase">{children}</label>;
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary"
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary resize-none"
    />
  );
}

// ─── Tool 1: Grade Subjective Answer ──────────────────────────────────────────

const GradeSubjectiveTool = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [rubric, setRubric] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<GradeSubjectiveResult | null>(null);

  const mutation = useGradeSubjective();

  const handleRun = async () => {
    if (!question.trim() || !answer.trim()) return;
    setError("");
    setResult(null);
    try {
      const data = await mutation.mutateAsync({
        questionText: question,
        studentAnswer: answer,
        rubric: rubric || undefined,
        subjectArea: subject || undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to grade answer.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Question</Label>
        <Textarea rows={2} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Enter the question asked to the student..." />
      </div>
      <div className="space-y-2">
        <Label>Student Answer</Label>
        <Textarea rows={4} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Paste the student's answer here..." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Subject Area (optional)</Label>
          <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics, Chemistry..." />
        </div>
        <div className="space-y-2">
          <Label>Rubric / Marking Criteria (optional)</Label>
          <Input value={rubric} onChange={e => setRubric(e.target.value)} placeholder="e.g. Explain Newton's law + formula + example" />
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      <Button onClick={handleRun} disabled={mutation.isPending || !question.trim() || !answer.trim()} className="gap-2">
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Grade Answer
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
          {/* Score */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-foreground">Grading Result</h4>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-extrabold ${result.percentage >= 70 ? "text-emerald-500" : result.percentage >= 40 ? "text-amber-500" : "text-red-500"}`}>
                  {result.percentage.toFixed(0)}%
                </span>
                <span className="text-sm text-muted-foreground">({result.score}/{result.maxScore})</span>
              </div>
            </div>

            {/* Score bar */}
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-700 ${result.percentage >= 70 ? "bg-emerald-500" : result.percentage >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${result.percentage}%` }}
              />
            </div>

            <p className="text-sm text-foreground">{result.feedback}</p>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.strengths?.length > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-xs font-bold text-emerald-600 mb-2 uppercase">Strengths</p>
                <ul className="space-y-1">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.improvements?.length > 0 && (
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                <p className="text-xs font-bold text-orange-600 mb-2 uppercase">Areas to Improve</p>
                <ul className="space-y-1">
                  {result.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ─── Tool 2: Engagement Detection ─────────────────────────────────────────────

const EngagementDetectTool = () => {
  const [studentId, setStudentId] = useState("");
  const [clickRate, setClickRate] = useState("");
  const [scrollDepth, setScrollDepth] = useState("");
  const [pauseCount, setPauseCount] = useState("");
  const [replayCount, setReplayCount] = useState("");
  const [timeOnPage, setTimeOnPage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<EngagementDetectResult | null>(null);

  const mutation = useDetectEngagement();

  const handleRun = async () => {
    setError("");
    setResult(null);
    try {
      const data = await mutation.mutateAsync({
        studentId: studentId || undefined,
        signals: {
          clickRate: clickRate ? parseFloat(clickRate) : undefined,
          scrollDepth: scrollDepth ? parseFloat(scrollDepth) : undefined,
          pauseCount: pauseCount ? parseInt(pauseCount) : undefined,
          replayCount: replayCount ? parseInt(replayCount) : undefined,
          timeOnPage: timeOnPage ? parseInt(timeOnPage) : undefined,
        },
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to detect engagement.");
    }
  };

  const levelColors: Record<string, string> = {
    high: "text-emerald-500",
    medium: "text-amber-500",
    low: "text-orange-500",
    disengaged: "text-red-500",
  };

  const levelBg: Record<string, string> = {
    high: "bg-emerald-500/10 border-emerald-500/20",
    medium: "bg-amber-500/10 border-amber-500/20",
    low: "bg-orange-500/10 border-orange-500/20",
    disengaged: "bg-red-500/10 border-red-500/20",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Enter student engagement signals from your LMS or video platform to assess engagement level.</p>

      <div className="space-y-2">
        <Label>Student ID (optional)</Label>
        <Input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student UUID or ID" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Click Rate</Label>
          <Input type="number" value={clickRate} onChange={e => setClickRate(e.target.value)} placeholder="e.g. 0.5" />
        </div>
        <div className="space-y-2">
          <Label>Scroll Depth (%)</Label>
          <Input type="number" value={scrollDepth} onChange={e => setScrollDepth(e.target.value)} placeholder="e.g. 75" />
        </div>
        <div className="space-y-2">
          <Label>Pause Count</Label>
          <Input type="number" value={pauseCount} onChange={e => setPauseCount(e.target.value)} placeholder="e.g. 3" />
        </div>
        <div className="space-y-2">
          <Label>Replay Count</Label>
          <Input type="number" value={replayCount} onChange={e => setReplayCount(e.target.value)} placeholder="e.g. 2" />
        </div>
        <div className="space-y-2">
          <Label>Time on Page (sec)</Label>
          <Input type="number" value={timeOnPage} onChange={e => setTimeOnPage(e.target.value)} placeholder="e.g. 600" />
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      <Button onClick={handleRun} disabled={mutation.isPending} className="gap-2">
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Detect Engagement
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
          <div className={`border rounded-2xl p-5 ${levelBg[result.engagementLevel] ?? "bg-card border-border"}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-foreground">Engagement Level</h4>
              <span className={`text-xl font-extrabold capitalize ${levelColors[result.engagementLevel] ?? "text-foreground"}`}>
                {result.engagementLevel}
              </span>
            </div>
            <div className="h-2.5 bg-black/10 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-700 ${result.engagementLevel === "high" ? "bg-emerald-500" : result.engagementLevel === "medium" ? "bg-amber-500" : result.engagementLevel === "low" ? "bg-orange-500" : "bg-red-500"}`}
                style={{ width: `${result.engagementScore}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Score: {result.engagementScore}/100</p>
          </div>

          {result.insights?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Insights</p>
              <ul className="space-y-1">
                {result.insights.map((i, idx) => <li key={idx} className="text-sm text-foreground">• {i}</li>)}
              </ul>
            </div>
          )}

          {result.recommendations?.length > 0 && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-600 uppercase mb-2">Recommendations</p>
              <ul className="space-y-1">
                {result.recommendations.map((r, idx) => <li key={idx} className="text-sm text-foreground">• {r}</li>)}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// ─── Tool 3: Lecture Notes from Audio ─────────────────────────────────────────

const LectureNotesTool = () => {
  const [audioUrl, setAudioUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState("");
  const [result, setResult] = useState<SttNotesResult | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const mutation = useGenerateLectureNotes();

  const handleRun = async () => {
    if (!audioUrl.trim()) return;
    setError("");
    setResult(null);
    try {
      const data = await mutation.mutateAsync({ audioUrl, language: language || undefined });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to generate notes.");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Generate structured lecture notes, key concepts, and a summary from an audio recording URL.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-2">
          <Label>Audio URL</Label>
          <Input value={audioUrl} onChange={e => setAudioUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
          </select>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      <Button onClick={handleRun} disabled={mutation.isPending || !audioUrl.trim()} className="gap-2">
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
        Generate Notes
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
          {/* Summary */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-foreground">Summary</h4>
              <CopyButton text={result.summary} />
            </div>
            <p className="text-sm text-foreground">{result.summary}</p>
          </div>

          {/* Key Concepts */}
          {result.keyConcepts?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h4 className="font-bold text-foreground mb-3">Key Concepts</h4>
              <div className="flex flex-wrap gap-2">
                {result.keyConcepts.map((c, i) => (
                  <span key={i} className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {result.notesMarkdown && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-foreground">Lecture Notes</h4>
                <CopyButton text={result.notesMarkdown} />
              </div>
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{result.notesMarkdown}</pre>
            </div>
          )}

          {/* Full Transcript Toggle */}
          {result.transcript && (
            <div className="bg-secondary/50 border border-border rounded-xl">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Full Transcript</span>
                {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showTranscript && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{result.transcript}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// ─── Tool 4: Generate Student Feedback ────────────────────────────────────────

const GenerateFeedbackTool = () => {
  const [studentId, setStudentId] = useState("");
  const [avgScore, setAvgScore] = useState("");
  const [weakTopics, setWeakTopics] = useState("");
  const [strongTopics, setStrongTopics] = useState("");
  const [recentScores, setRecentScores] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<FeedbackGenerateResult | null>(null);

  const mutation = useGenerateFeedback();

  const handleRun = async () => {
    if (!avgScore) return;
    setError("");
    setResult(null);
    try {
      const scores = recentScores
        .split(",")
        .map(s => parseFloat(s.trim()))
        .filter(n => !isNaN(n));

      const data = await mutation.mutateAsync({
        studentId: studentId || undefined,
        performanceData: {
          averageScore: parseFloat(avgScore),
          weakTopics: weakTopics.split(",").map(s => s.trim()).filter(Boolean),
          strongTopics: strongTopics.split(",").map(s => s.trim()).filter(Boolean),
          recentTestScores: scores,
        },
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to generate feedback.");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Generate personalized, AI-written feedback and a study plan for a student based on their performance data.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Student ID (optional)</Label>
          <Input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="UUID or leave blank" />
        </div>
        <div className="space-y-2">
          <Label>Average Score (%)</Label>
          <Input type="number" value={avgScore} onChange={e => setAvgScore(e.target.value)} placeholder="e.g. 65" />
        </div>
        <div className="space-y-2">
          <Label>Weak Topics (comma-separated)</Label>
          <Input value={weakTopics} onChange={e => setWeakTopics(e.target.value)} placeholder="e.g. Thermodynamics, Optics" />
        </div>
        <div className="space-y-2">
          <Label>Strong Topics (comma-separated)</Label>
          <Input value={strongTopics} onChange={e => setStrongTopics(e.target.value)} placeholder="e.g. Mechanics, Kinematics" />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label>Recent Test Scores (comma-separated)</Label>
          <Input value={recentScores} onChange={e => setRecentScores(e.target.value)} placeholder="e.g. 72, 65, 58, 80" />
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      <Button onClick={handleRun} disabled={mutation.isPending || !avgScore} className="gap-2">
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
        Generate Feedback
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
          {/* Main Feedback */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-foreground">Personalized Feedback</h4>
              <CopyButton text={result.feedback} />
            </div>
            <p className="text-sm text-foreground leading-relaxed">{result.feedback}</p>
          </div>

          {/* Motivational */}
          {result.motivationalMessage && (
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
              <p className="text-xs font-bold text-violet-600 mb-1 uppercase">Motivational Note</p>
              <p className="text-sm text-foreground italic">"{result.motivationalMessage}"</p>
            </div>
          )}

          {/* Priority Topics */}
          {result.priorityTopics?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Priority Topics to Focus</p>
              <div className="flex flex-wrap gap-2">
                {result.priorityTopics.map((t, i) => (
                  <span key={i} className="text-xs font-semibold bg-red-500/10 text-red-600 px-3 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Study Plan */}
          {result.studyPlan?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Suggested Study Plan</p>
              <ol className="space-y-1.5">
                {result.studyPlan.map((step, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-xs bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// ─── Tool 5: Performance Analyzer ─────────────────────────────────────────────

const PerformanceAnalyzeTool = () => {
  const [studentId, setStudentId] = useState("");
  const [historyRaw, setHistoryRaw] = useState(
    `[
  { "score": 72, "totalQuestions": 30, "correctAnswers": 22, "topicName": "Mechanics" },
  { "score": 55, "totalQuestions": 25, "correctAnswers": 14, "topicName": "Thermodynamics" }
]`
  );
  const [error, setError] = useState("");
  const [result, setResult] = useState<PerformanceAnalyzeResult | null>(null);

  const mutation = useAnalyzePerformance();

  const handleRun = async () => {
    setError("");
    setResult(null);
    let history: any[];
    try {
      history = JSON.parse(historyRaw);
    } catch {
      setError("Invalid JSON in test history. Please fix the format.");
      return;
    }
    try {
      const data = await mutation.mutateAsync({
        studentId: studentId || undefined,
        testHistory: history,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to analyze performance.");
    }
  };

  const trendColor: Record<string, string> = {
    improving: "text-emerald-500",
    declining: "text-red-500",
    stable: "text-amber-500",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Analyze a student's test history to surface trends, weak areas, and improvement predictions.</p>

      <div className="space-y-2">
        <Label>Student ID (optional)</Label>
        <Input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="UUID or leave blank" />
      </div>

      <div className="space-y-2">
        <Label>Test History (JSON array)</Label>
        <Textarea
          rows={8}
          value={historyRaw}
          onChange={e => setHistoryRaw(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Each entry: score, totalQuestions, correctAnswers, topicName (optional), takenAt (optional)</p>
      </div>

      {error && <ErrorAlert message={error} />}

      <Button onClick={handleRun} disabled={mutation.isPending} className="gap-2">
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
        Analyze Performance
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
          {/* Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Overall Trend</p>
              <p className={`text-xl font-extrabold capitalize ${trendColor[result.overallTrend] ?? "text-foreground"}`}>
                {result.overallTrend}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Avg Score</p>
              <p className="text-xl font-extrabold text-foreground">{result.averageScore?.toFixed(1)}%</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Predicted Score</p>
              <p className="text-xl font-extrabold text-primary">{result.predictedScore?.toFixed(1)}%</p>
            </div>
          </div>

          {/* Weak / Strong */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.weakAreas?.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-xs font-bold text-red-600 uppercase mb-2">Weak Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.weakAreas.map((a, i) => (
                    <span key={i} className="text-xs bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            )}
            {result.strongAreas?.length > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Strong Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.strongAreas.map((a, i) => (
                    <span key={i} className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Insights & Recommendations */}
          {result.insights?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Insights</p>
              <ul className="space-y-1">
                {result.insights.map((ins, i) => <li key={i} className="text-sm text-foreground">• {ins}</li>)}
              </ul>
            </div>
          )}
          {result.recommendations?.length > 0 && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-600 uppercase mb-2">Recommendations</p>
              <ul className="space-y-1">
                {result.recommendations.map((r, i) => <li key={i} className="text-sm text-foreground">• {r}</li>)}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

type ToolId = "grade" | "engagement" | "notes" | "feedback" | "analyze";

const TOOLS: { id: ToolId; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "grade", label: "Grade Answer", description: "AI-powered subjective answer grading with rubric", icon: BookOpen },
  { id: "engagement", label: "Engagement Check", description: "Detect student engagement level from LMS signals", icon: Sparkles },
  { id: "notes", label: "Lecture Notes", description: "Auto-generate notes & key concepts from audio", icon: Mic },
  { id: "feedback", label: "Student Feedback", description: "Generate personalized feedback & study plan", icon: MessageSquare },
  { id: "analyze", label: "Performance Analyzer", description: "Analyze test history, predict trends & weak areas", icon: BarChart3 },
];

const TeacherAIToolsPage = () => {
  const [activeTool, setActiveTool] = useState<ToolId>("grade");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> AI Tools
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">5 AI-powered tools to enhance your teaching workflow</p>
      </div>

      {/* Tool Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {TOOLS.map(tool => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${isActive ? "bg-primary/10 border-primary/30" : "bg-card border-border hover:bg-secondary/50"}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${isActive ? "bg-primary/20" : "bg-secondary"}`}>
                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <p className={`text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>{tool.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{tool.description}</p>
            </button>
          );
        })}
      </div>

      {/* Active Tool Panel */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          {(() => {
            const tool = TOOLS.find(t => t.id === activeTool)!;
            const Icon = tool.icon;
            return (
              <>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{tool.label}</h3>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
              </>
            );
          })()}
        </div>

        {activeTool === "grade" && <GradeSubjectiveTool />}
        {activeTool === "engagement" && <EngagementDetectTool />}
        {activeTool === "notes" && <LectureNotesTool />}
        {activeTool === "feedback" && <GenerateFeedbackTool />}
        {activeTool === "analyze" && <PerformanceAnalyzeTool />}
      </div>
    </motion.div>
  );
};

export default TeacherAIToolsPage;
