import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { MarkdownRenderer, formatMarkdown } from "@/components/shared/MarkdownRenderer";
import "katex/dist/katex.min.css";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion";
import {
  Video, Plus, Loader2, X, Trash2, CheckCircle, Clock, Radio,
  Upload, Youtube, Image as ImageIcon, ImagePlus, FileText, Sparkles,
  Eye, EyeOff, Copy, Edit3, Send, Calendar, Link2, Users, BarChart2, BarChart3,
  PlayCircle, StopCircle, Zap, BookOpen, ChevronRight,
  AlarmClock, ExternalLink, Mic, Brain, ListChecks,
  HelpCircle, RefreshCw, RotateCcw, Trophy, TrendingUp, XCircle, AlertTriangle,
  Brush, Move, SquareDashedMousePointer,
  PanelRightClose, PanelRightOpen, ArrowLeft, ArrowRight, CalendarDays, Clock3, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/context/ConfirmContext";
import { cn } from "@/lib/utils";
import { useHasAiFeature } from "@/hooks/use-tenant-features";
import { useIsCompactLayout } from "@/hooks/use-mobile";
import {
  useMyLectures, useCreateLecture, useDeleteLecture,
  useUpdateLecture, useLectureStats, useMyBatches,
} from "@/hooks/use-teacher";
import { useSubjects, useChapters, useTopics } from "@/hooks/use-admin";
import { useAuthStore } from "@/lib/auth-store";
import { getBatchSubjectTeachers } from "@/lib/api/teacher";
import {
  generateLectureNotes, updateLecture as updateLectureApi,
  generateQuizForLecture, saveQuizCheckpoints, getQuizCheckpoints,
  getWatchAnalytics, retranscribeLecture, regenerateNotes, refreshLectureNoteVisuals,
  type QuizCheckpoint, type WatchAnalytics,
} from "@/lib/api/teacher";
import { apiClient } from "@/lib/api/client";
import { getApiOrigin } from "@/lib/api-config";
import { liveBroadcast, type BroadcastLecture, type BroadcastCreated, type BroadcastStats } from "@/lib/api/live-broadcast";
import { PostClassSummary } from './TeacherLiveDashboard';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Lecture } from "@/lib/api/teacher";
import { LectureVideoUpload } from "@/components/upload/LectureVideoUpload";
import { SchoolVideoPlayer } from "@/components/school/SchoolVideoPlayer";
import { CourseTabs, CourseTabId } from "@/components/student/lecture/CourseTabs";
import { AssignmentManagerModal } from "@/components/teacher/AssignmentManagerModal";
import { guessImageMimeFromName, uploadToS3 } from "@/lib/api/upload";
import {
  isYouTubeUrl,
  isValidYouTubeLectureUrl,
  YOUTUBE_LECTURE_CAPTIONS_HINT,
  getYouTubeThumbnail,
} from "@/lib/lecture-source";
import { CustomSelect } from "@/components/ui/CustomSelect";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  published: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  draft: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  live: "bg-red-500/10 text-red-600 border-red-500/20",
  scheduled: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  ended: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

const statusLabel: Record<string, string> = {
  published: "Published", draft: "Review AI Notes", processing: "AI Processing…",
  live: "Live Now", scheduled: "Scheduled", ended: "Ended",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function cleanAiMarkdown(md: string) {
  if (!md) return "";
  return String(md)
    .replace(/\\n/g, "\n")
    .replace(/```+/g, " ")
    .replace(/\$(.*?)\$/gs, (_m, inner) =>
      String(inner)
        .replace(/\\text\s*\{([^}]*)\}/g, "$1")
        .replace(/\\pi/g, "pi")
        .replace(/\\times/g, " x ")
        .replace(/\\gt/g, ">")
        .replace(/\\lt/g, "<")
        .replace(/\\geq?/g, ">=")
        .replace(/\\leq?/g, "<=")
        .trim(),
    )
    .replace(/\\text\s*\{([^}]*)\}/g, "$1")
    .replace(/<\/?(?:noise|music|silence|pause|speaker\s*\d+|babble|cough|laugh(?:ter)?|applause|breath|sneeze)[^>]*\/?>/gi, "")
    .replace(/\[(?:silence|music|noise|speaker \d+|pause|babble|cough|laughter|applause|breath|sneeze)\]/gi, "")
    .replace(/([^\n])\s*(#{1,4} )/g, "$1\n\n$2")
    .replace(/([^\n])\s*(\* |- |\d+\. )/g, "$1\n$2")
    .replace(/\bXB\s*=\s*1\s+XA\b/gi, "XB = 1 - XA")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function embedStoredNoteImages(markdown: string, images: NonNullable<Lecture["aiNoteImages"]>): string {
  if (!markdown || images.length === 0) return markdown;
  const normalizeHeading = (value: string) => value
    .normalize("NFC")
    .replace(/^\s*#{1,6}\s*/, "")
    .replace(/[*_`~]/g, "")
    .replace(/^\s*\d+[.)-]?\s*/, "")
    .replace(/[：:|–—-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  let result = markdown;
  for (const image of images) {
    if (!image?.url || result.includes(image.url)) continue;
    const caption = String(image.caption || image.section_heading || "Educational visual");
    const safeCaption = caption.replace(/\]/g, "\\]");
    const imageMarkdown = `\n![${safeCaption}](${image.url})\n*${caption}*\n`;
    const lines = result.split("\n");
    const target = normalizeHeading(image.section_heading || "");
    let headingIndex = target
      ? lines.findIndex((line) => /^\s*#{1,6}\s+/.test(line) && normalizeHeading(line) === target)
      : -1;
    if (headingIndex === -1 && target) {
      headingIndex = lines.findIndex((line) => {
        if (!/^\s*#{1,6}\s+/.test(line)) return false;
        const candidate = normalizeHeading(line);
        return candidate.includes(target) || target.includes(candidate);
      });
    }
    if (headingIndex === -1) {
      result = `${result.trimEnd()}\n\n${imageMarkdown.trim()}\n`;
    } else {
      lines.splice(headingIndex + 1, 0, imageMarkdown);
      result = lines.join("\n");
    }
  }
  return result;
}

interface OverlayLabel {
  text: string;
  x: number;
  y: number;
  px?: number;
  py?: number;
}

interface NoteImage {
  url: string;
  caption: string;
  fullMatch: string;
  overlayLabels: OverlayLabel[];
}

function parseNoteImageAlt(alt?: string | null) {
  const raw = String(alt || "").trim();
  const overlayMatch = raw.match(/\s*<<NOTE_IMAGE_OVERLAY:([A-Za-z0-9_-]+)>>\s*/);
  const overlayLabels = (() => {
    if (!overlayMatch) return [] as OverlayLabel[];
    try {
      const padded = overlayMatch[1] + "=".repeat((4 - (overlayMatch[1].length % 4)) % 4);
      const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const payload = JSON.parse(new TextDecoder().decode(bytes));
      return Array.isArray(payload?.labels)
        ? payload.labels
          .map((label: any) => ({
            text: String(label?.text || "").trim(),
            x: Number(label?.x),
            y: Number(label?.y),
            px: label?.px !== undefined && Number.isFinite(Number(label.px)) ? Number(label.px) : undefined,
            py: label?.py !== undefined && Number.isFinite(Number(label.py)) ? Number(label.py) : undefined,
          }))
          .filter((label: any) => label.text && Number.isFinite(label.x) && Number.isFinite(label.y))
        : [];
    } catch {
      return [];
    }
  })();
  const withoutOverlay = raw.replace(/\s*<<NOTE_IMAGE_OVERLAY:[A-Za-z0-9_-]+>>\s*/g, "").trim();
  const [caption, legend] = withoutOverlay.split(/\s+\|\s+Legend:\s+/i);
  return {
    caption: (caption || withoutOverlay || "Generated educational visual").trim(),
    legend: (legend || "").trim(),
    overlayLabels,
  };
}

function encodeNoteImageAlt(caption: string, labels: OverlayLabel[]) {
  if (!labels || labels.length === 0) return caption;
  const payload = { labels };
  const jsonStr = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(jsonStr);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  const base64 = btoa(binary);
  const base64url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `${caption} <<NOTE_IMAGE_OVERLAY:${base64url}>>`;
}

function extractImagesFromMarkdown(markdown: string): NoteImage[] {
  const images: NoteImage[] = [];
  if (!markdown) return images;
  const regex = /!\[([^\]]*?)\]\(([^)]+?)\)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const fullMatch = match[0];
    const alt = match[1];
    const url = match[2];
    const parsed = parseNoteImageAlt(alt);
    images.push({
      url,
      caption: parsed.caption,
      fullMatch,
      overlayLabels: parsed.overlayLabels,
    });
  }
  return images;
}

function getNotesSections(markdown: string) {
  const sections: { title: string; index: number; fullHeading: string }[] = [];
  if (!markdown) return sections;
  const mdRegex = /^(#{1,6})\s+(.+)$/gm;
  const htmlRegex = /<(h[1-6])(?:\s+[^>]*)*>(.*?)<\/h[1-6]>/gi;

  let match;
  while ((match = mdRegex.exec(markdown)) !== null) {
    sections.push({
      title: match[2].trim(),
      index: match.index,
      fullHeading: match[0],
    });
  }
  while ((match = htmlRegex.exec(markdown)) !== null) {
    sections.push({
      title: match[2].replace(/<[^>]*>/g, "").trim(),
      index: match.index,
      fullHeading: match[0],
    });
  }
  return sections.sort((a, b) => a.index - b.index);
}

function insertImageAfterSection(markdown: string, sectionHeading: string, imageMarkdownBlock: string): string {
  if (!sectionHeading) {
    return markdown + "\n\n" + imageMarkdownBlock;
  }
  const idx = markdown.indexOf(sectionHeading);
  if (idx === -1) {
    return markdown + "\n\n" + imageMarkdownBlock;
  }
  const remainingText = markdown.slice(idx + sectionHeading.length);
  const nextHeadingMatch = remainingText.match(/^(#{1,6}\s+|<h[1-6][^>]*>)/m);

  if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
    const insertIdx = idx + sectionHeading.length + nextHeadingMatch.index;
    return markdown.slice(0, insertIdx).trimEnd() + "\n\n" + imageMarkdownBlock + "\n\n" + markdown.slice(insertIdx).trimStart();
  } else {
    return markdown.trimEnd() + "\n\n" + imageMarkdownBlock;
  }
}

function toTranscriptParagraphs(transcript?: string | null): string[] {
  const raw = String(transcript || "").trim();
  if (!raw) return [];

  const byBlocks = raw.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (byBlocks.length > 1) return byBlocks;

  const normalized = raw.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const sentences = normalized
    .split(/(?<=[.!?।])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 3) return [normalized];

  const grouped: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    grouped.push(sentences.slice(i, i + 3).join(" "));
  }
  return grouped;
}

// ─── Processing Animation ─────────────────────────────────────────────────────

const NOTES_GEN_STEPS = [
  { label: "Cleaning transcript…" },
  { label: "Generating chunk notes…" },
  { label: "Merging & structuring…" },
  { label: "Finalising notes…" },
];

// % boundaries for each notes-gen step
const NOTES_BOUNDARIES = [0, 15, 60, 88, 100];

function useNotesGenerationProgress(isActive: boolean) {
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive) { startRef.current = Date.now(); setElapsed(0); return; }
    startRef.current = Date.now();
    const id = setInterval(() =>
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
      , 1000);
    return () => clearInterval(id);
  }, [isActive]);

  const currentStep = elapsed < 5 ? 0 : elapsed < 25 ? 1 : elapsed < 55 ? 2 : 3;
  const stepStart = NOTES_BOUNDARIES[currentStep];
  const stepEnd = NOTES_BOUNDARIES[Math.min(currentStep + 1, 4)];
  const withinStep =
    currentStep === 0 ? Math.min(elapsed / 5, 1) :
      currentStep === 1 ? Math.min((elapsed - 5) / 20, 1) :
        currentStep === 2 ? Math.min((elapsed - 25) / 30, 1) :
          Math.min((elapsed - 55) / 90, 1);
  const progressPct = Math.min(Math.round(stepStart + (stepEnd - stepStart) * withinStep), 99);

  return { elapsed, currentStep, progressPct };
}

const AI_STEPS_EN = [
  { icon: Mic, label: "Transcribing audio" },
  { icon: Brain, label: "Analysing content" },
  { icon: FileText, label: "Generating lecture notes" },
  { icon: ListChecks, label: "Extracting key concepts" },
];

const AI_STEPS_HINGLISH = [
  { icon: Mic, label: "Transcribing Hinglish audio" },
  { icon: Brain, label: "Translating to English (Sarvam AI)" },
  { icon: FileText, label: "Generating lecture notes" },
  { icon: ListChecks, label: "Extracting key concepts" },
];

const AI_STEPS_ODIA = [
  { icon: Mic, label: "Transcribing Odia audio (Sarvam AI)" },
  { icon: Brain, label: "Analysing Odia content (Gemini)" },
  { icon: FileText, label: "Generating Odia lecture notes" },
  { icon: ListChecks, label: "Adding educational visuals" },
];

// Sub-steps shown under "Transcribing audio" as time elapses
const TRANSCRIBE_SUB_EN = [
  "Downloading video from storage…",
  "Splitting audio into chunks…",
  "Sending chunks to Whisper AI…",
  "Finishing transcription…",
];
const TRANSCRIBE_SUB_HINGLISH = [
  "Downloading video from storage…",
  "Splitting audio into chunks…",
  "Transcribing Hinglish audio…",
  "Finishing transcription…",
];
const TRANSCRIBE_SUB_ODIA = [
  "Downloading video from storage…",
  "Splitting audio into Sarvam-compatible chunks…",
  "Transcribing Odia audio with Sarvam AI…",
  "Finishing Odia transcription…",
];

function fmtElapsed(secs: number) {
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

// ─── Estimated processing time based on video duration ───────────────────────
function estimateProcessingTime(durationSeconds?: number, isHinglish?: boolean): {
  transcription: string;
  notes: string;
  total: string;
  totalMinLow: number;
  totalMinHigh: number;
} {
  // Server-side Groq Whisper on chunked audio; these are conservative (slow-server) estimates
  const d = durationSeconds ?? 0;
  let tLow: number, tHigh: number;
  if (d === 0) { tLow = 4; tHigh = 8; }   // unknown length
  else if (d <= 900) { tLow = 3; tHigh = 6; }   // ≤ 15 min
  else if (d <= 1800) { tLow = 5; tHigh = 9; }   // 15–30 min
  else if (d <= 3600) { tLow = 8; tHigh = 15; }   // 30–60 min
  else if (d <= 7200) { tLow = 14; tHigh = 25; }   // 1–2 hr
  else { tLow = 22; tHigh = 45; }   // > 2 hr (3hr video)

  if (isHinglish) { tLow += 2; tHigh += 4; }  // extra translation step

  const nLow = 2; const nHigh = 4;
  return {
    transcription: `~${tLow}–${tHigh} min`,
    notes: `~${nLow}–${nHigh} min`,
    total: `~${tLow + nLow}–${tHigh + nHigh} min`,
    totalMinLow: tLow + nLow,
    totalMinHigh: tHigh + nHigh,
  };
}

// Shared progress calculation — used by both AiProcessingCard and RecordedCard
const AI_STEP_BOUNDARIES = [0, 52, 68, 84, 100]; // % at start of each step + end

function useAiProgress(lecture: Lecture, activeStep?: number) {
  const isActive = lecture.status === "processing"
    || lecture.transcriptStatus === "processing"
    || lecture.transcriptStatus === "pending";

  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Math.floor((Date.now() - new Date(lecture.createdAt).getTime()) / 1000))
  );
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() =>
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(lecture.createdAt).getTime()) / 1000)))
      , 1000);
    return () => clearInterval(id);
  }, [isActive, lecture.createdAt]);

  // Slow-server friendly: step 0 (transcribing) lasts until 5 min, then briefly step 1 before backend status arrives
  const timeBasedStep =
    elapsed < 300 ? 0 :
      elapsed < 360 ? 1 :
        elapsed < 420 ? 2 :
          3;

  const currentStep = activeStep !== undefined ? activeStep : (
    (lecture.status === "draft" || lecture.status === "published") && lecture.transcriptStatus !== "processing" && lecture.transcriptStatus !== "pending"
      ? 4
      : lecture.status === "processing" && lecture.transcriptStatus === "done"
        ? 2
        : (lecture.transcriptStatus === "processing" || lecture.transcriptStatus === "pending")
          ? timeBasedStep
          : 1
  );

  const stepStart = AI_STEP_BOUNDARIES[Math.min(currentStep, 4)] ?? 0;
  const stepEnd = AI_STEP_BOUNDARIES[Math.min(currentStep + 1, 4)];
  const withinStep = currentStep === 0
    ? Math.min(elapsed / 300, 1)
    : currentStep === 1
      ? Math.min((elapsed - 300) / 60, 1)
      : currentStep === 2
        ? Math.min((elapsed - 360) / 120, 1)
        : Math.min((elapsed - 480) / 60, 1);
  const progressPct = Math.round(stepStart + (stepEnd - stepStart) * withinStep);

  const subStepIdx =
    elapsed < 20 ? 0 :
      elapsed < 60 ? 1 :
        elapsed < 240 ? 2 : 3;

  return { isActive, elapsed, currentStep, progressPct, subStepIdx };
}

function AiProcessingCard({ lecture, activeStep }: { lecture: Lecture; activeStep?: number }) {
  const isHinglish = lecture.lectureLanguage === "hinglish" || lecture.lectureLanguage === "hi";
  const isOdia = lecture.lectureLanguage === "od";
  const steps = isOdia ? AI_STEPS_ODIA : isHinglish ? AI_STEPS_HINGLISH : AI_STEPS_EN;
  const subSteps = isOdia ? TRANSCRIBE_SUB_ODIA : isHinglish ? TRANSCRIBE_SUB_HINGLISH : TRANSCRIBE_SUB_EN;

  const { isActive, elapsed, currentStep, progressPct, subStepIdx } = useAiProgress(lecture, activeStep);
  const est = estimateProcessingTime(lecture.videoDurationSeconds, isHinglish);

  const showSubStep = currentStep === 0 && isActive;
  const isNotesPhase = lecture.transcriptStatus === "done" && lecture.status === "processing";

  // Phase label shown in the time estimator
  const phaseLabel = isNotesPhase ? "Generating notes" : "Transcribing audio";
  const phaseEst = isNotesPhase ? est.notes : est.transcription;

  return (
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            AI is processing &ldquo;{lecture.title}&rdquo;
          </p>
          <p className="text-xs text-muted-foreground">
            {isHinglish
              ? "Hinglish → English → Notes. No action needed."
              : "No action needed — notes will be ready soon"}
          </p>
        </div>
        {isActive && (
          <div className="shrink-0 text-right">
            <p className="text-xs font-mono font-semibold text-blue-600">{fmtElapsed(elapsed)}</p>
            <p className="text-[10px] text-muted-foreground">elapsed</p>
          </div>
        )}
      </div>

      {/* Steps list */}
      <div className="space-y-2">
        {steps.map((s, i) => {
          const done = i < currentStep;
          const current = i === currentStep;
          const Icon = s.icon;
          return (
            <div key={i}>
              <div className="flex items-center gap-2.5">
                {done
                  ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  : current
                    ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                    : <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0" />}
                <span className={cn("text-xs flex items-center gap-1.5",
                  done ? "text-muted-foreground line-through" :
                    current ? "text-foreground font-medium" :
                      "text-muted-foreground/50")}>
                  <Icon className="w-3 h-3 shrink-0" />
                  {s.label}
                </span>
              </div>
              {current && showSubStep && i === 0 && (
                <p className="ml-[26px] text-[11px] text-blue-500/70 mt-0.5 animate-pulse">
                  {subSteps[subStepIdx]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Estimated time breakdown */}
      <div className="bg-blue-500/8 rounded-xl p-3 space-y-1.5 border border-blue-500/10">
        <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Estimated time</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <Mic className="w-3 h-3 text-blue-500/70 shrink-0" />
            <span className="text-[11px] text-muted-foreground">Transcription</span>
            <span className="text-[11px] font-semibold text-foreground ml-auto">{est.transcription}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-blue-500/70 shrink-0" />
            <span className="text-[11px] text-muted-foreground">Notes gen</span>
            <span className="text-[11px] font-semibold text-foreground ml-auto">{est.notes}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-0.5 border-t border-blue-500/10">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <AlarmClock className="w-3 h-3" />
            Total est.
          </span>
          <span className="text-[11px] font-bold text-blue-600">{est.total}</span>
        </div>
        {isActive && (
          <p className="text-[10px] text-blue-500/70 text-center animate-pulse">
            Currently: {phaseLabel} ({phaseEst})
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full h-1.5 bg-blue-500/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-right">{progressPct}% complete</p>
      </div>
    </div>
  );
}

interface ImageEditorCanvasProps {
  imageUrl: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
  isSaving: boolean;
}

type ImageEditorMode = "brush" | "move";

type CanvasSelection = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type ImageEditorInteraction =
  | { type: "brush" }
  | { type: "select"; startX: number; startY: number }
  | {
    type: "move";
    startX: number;
    startY: number;
    original: CanvasSelection;
    imageData: ImageData;
    snapshot: ImageData;
  };

function ImageEditorCanvas({ imageUrl, onSave, onCancel, isSaving }: ImageEditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [brushColor, setBrushColor] = useState("#ffffff"); // Default white for eraser
  const [isDrawing, setIsDrawing] = useState(false);
  const [editorMode, setEditorMode] = useState<ImageEditorMode>("brush");
  const [selection, setSelection] = useState<CanvasSelection | null>(null);
  const interactionRef = useRef<ImageEditorInteraction | null>(null);
  const [history, setHistory] = useState<string[]>([]); // To support Undo
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Load image onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous"; // Essential to prevent tainted canvas issues during toBlob
    img.onload = () => {
      // Set canvas size to match image aspect ratio, but keep size reasonable
      const maxW = 600;
      const maxH = 400;
      let w = img.width;
      let h = img.height;

      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(img, 0, 0, w, h);

      // Save initial state to history
      const initialData = canvas.toDataURL();
      setHistory([initialData]);
      setHistoryIndex(0);
      setImgLoaded(true);
      setSelection(null);
      interactionRef.current = null;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const clampSelection = (rect: CanvasSelection): CanvasSelection => {
    const canvas = canvasRef.current;
    if (!canvas) return rect;
    const x1 = Math.max(0, Math.min(canvas.width, rect.x));
    const y1 = Math.max(0, Math.min(canvas.height, rect.y));
    const x2 = Math.max(0, Math.min(canvas.width, rect.x + rect.w));
    const y2 = Math.max(0, Math.min(canvas.height, rect.y + rect.h));
    return {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      w: Math.abs(x2 - x1),
      h: Math.abs(y2 - y1),
    };
  };

  const createSelectionFromPoints = (startX: number, startY: number, endX: number, endY: number): CanvasSelection => {
    return clampSelection({
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      w: Math.abs(endX - startX),
      h: Math.abs(endY - startY),
    });
  };

  const moveSelectionTo = (
    ctx: CanvasRenderingContext2D,
    interaction: Extract<ImageEditorInteraction, { type: "move" }>,
    nextX: number,
    nextY: number,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return interaction.original;
    const w = interaction.original.w;
    const h = interaction.original.h;
    const x = Math.max(0, Math.min(canvas.width - w, nextX));
    const y = Math.max(0, Math.min(canvas.height - h, nextY));

    ctx.putImageData(interaction.snapshot, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(interaction.original.x, interaction.original.y, w, h);
    ctx.putImageData(interaction.imageData, Math.round(x), Math.round(y));

    return { x: Math.round(x), y: Math.round(y), w, h };
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();

    // Clear future history if we were in the middle of undo stack
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(data);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setSelection(null);
      interactionRef.current = null;
    };
    img.src = history[newIndex];
  };

  const handleReset = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setHistoryIndex(0);
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setSelection(null);
      interactionRef.current = null;
    };
    img.src = history[0];
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;
    if ("touches" in e) {
      if (e.touches.length === 0) {
        if ("changedTouches" in e && e.changedTouches.length > 0) {
          clientX = e.changedTouches[0].clientX;
          clientY = e.changedTouches[0].clientY;
        } else {
          return null;
        }
      } else {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Scale coordinates back to canvas dimensions
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (editorMode === "move") {
      if (
        selection &&
        selection.w > 0 &&
        selection.h > 0 &&
        coords.x >= selection.x &&
        coords.x <= selection.x + selection.w &&
        coords.y >= selection.y &&
        coords.y <= selection.y + selection.h
      ) {
        const rounded = {
          x: Math.round(selection.x),
          y: Math.round(selection.y),
          w: Math.round(selection.w),
          h: Math.round(selection.h),
        };
        interactionRef.current = {
          type: "move",
          startX: coords.x,
          startY: coords.y,
          original: rounded,
          imageData: ctx.getImageData(rounded.x, rounded.y, rounded.w, rounded.h),
          snapshot: ctx.getImageData(0, 0, canvas.width, canvas.height),
        };
      } else {
        interactionRef.current = { type: "select", startX: coords.x, startY: coords.y };
        setSelection({ x: coords.x, y: coords.y, w: 0, h: 0 });
      }
      setIsDrawing(true);
      return;
    }

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;

    setIsDrawing(true);
    interactionRef.current = { type: "brush" };
    setSelection(null);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const interaction = interactionRef.current;

    if (interaction?.type === "select") {
      setSelection(createSelectionFromPoints(interaction.startX, interaction.startY, coords.x, coords.y));
      return;
    }

    if (interaction?.type === "move") {
      const nextX = interaction.original.x + (coords.x - interaction.startX);
      const nextY = interaction.original.y + (coords.y - interaction.startY);
      setSelection(moveSelectionTo(ctx, interaction, nextX, nextY));
      return;
    }

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const interaction = interactionRef.current;
    setIsDrawing(false);
    interactionRef.current = null;

    if (interaction?.type === "select") {
      setSelection((current) => current && current.w >= 4 && current.h >= 4 ? current : null);
      return;
    }

    if (interaction?.type === "brush" || interaction?.type === "move") {
      saveToHistory();
    }
  };

  const handleSaveClick = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, "image/png");
  };

  const selectionStyle = (() => {
    const canvas = canvasRef.current;
    if (!canvas || !selection || selection.w <= 0 || selection.h <= 0) return null;
    return {
      left: `${(selection.x / canvas.width) * 100}%`,
      top: `${(selection.y / canvas.height) * 100}%`,
      width: `${(selection.w / canvas.width) * 100}%`,
      height: `${(selection.h / canvas.height) * 100}%`,
    };
  })();

  return (
    <div className="space-y-4">
      {/* Editor toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/20 p-3 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setEditorMode("brush"); setSelection(null); }}
              className={cn("h-7 px-2 text-[10px] gap-1.5", editorMode === "brush" && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
              title="Paint or erase on the image"
            >
              <Brush className="w-3 h-3" /> Brush
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditorMode("move")}
              className={cn("h-7 px-2 text-[10px] gap-1.5", editorMode === "move" && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
              title="Select an area and drag it to a new position"
            >
              <Move className="w-3 h-3" /> Move Selection
            </Button>
          </div>

          <div className={cn("flex items-center gap-1.5", editorMode !== "brush" && "opacity-50 pointer-events-none")}>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Brush Color:</span>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-7 h-7 border border-border rounded cursor-pointer p-0 bg-transparent"
              title="Pick drawing/erasure color"
            />
          </div>

          <div className={cn("flex items-center gap-2", editorMode !== "brush" && "opacity-50 pointer-events-none")}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBrushColor("#ffffff")}
              className={`h-7 px-2 text-[10px] ${brushColor === "#ffffff" ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
            >
              White Eraser
            </Button>
          </div>

          <div className={cn("flex items-center gap-2", editorMode !== "brush" && "opacity-50 pointer-events-none")}>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Size:</span>
            <input
              type="range"
              min="5"
              max="60"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-24 h-1 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[10px] font-mono w-7 text-right">{brushSize}px</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="h-7 px-2.5 text-[10px] gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={history.length <= 1}
            className="h-7 px-2.5 text-[10px]"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Drawing Canvas Area */}
      <div className="relative border border-border rounded-xl bg-background flex items-center justify-center p-4 min-h-[300px] shadow-inner select-none overflow-hidden">
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        <div className="relative inline-flex max-h-[350px]">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className={cn(
              "border border-border/80 bg-white max-h-[350px] shadow-md touch-none",
              editorMode === "move" ? "cursor-move" : "cursor-crosshair"
            )}
          />
          {selectionStyle && (
            <div
              className="pointer-events-none absolute border-2 border-dashed border-primary bg-primary/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.08)]"
              style={selectionStyle}
            >
              <div className="absolute -top-6 left-0 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
                <SquareDashedMousePointer className="w-3 h-3" />
                Drag to move
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground italic text-center">
        {editorMode === "move"
          ? "Drag to select part of the image, then drag inside the selection to move it. Undo steps if needed."
          : "Use the brush to paint over labels or unwanted features of the diagram. Select White Eraser to white out items, or use custom brush color. Undo steps if needed."}
      </p>

      {/* Action Footer */}
      <div className="flex justify-end gap-2 pt-2 border-t border-border shrink-0">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="default" size="sm" onClick={handleSaveClick} disabled={isSaving || !imgLoaded} className="gap-1.5">
          {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save Edited Image
        </Button>
      </div>
    </div>
  );
}

// ─── Markdown Renderer (Preview) ─────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  // If the content is raw HTML (generated by Tiptap), render as HTML.
  // We check for typical wrapper tags Tiptap generates.
  const isHtml = /<[a-z][\s\S]*>/i.test(content) && (content.includes('<p>') || content.includes('<h1>') || content.includes('<ul>'));

  if (isHtml) {
    return (
      <div
        className="prose-notes prose prose-sm prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-li:text-foreground/80 text-foreground max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className="prose-notes">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={{
        h1: ({ children }) => <h1 className="text-2xl font-bold text-foreground mt-6 mb-3 pb-2 border-b border-border">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold text-foreground mt-5 mb-2 flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-primary inline-block shrink-0" />{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mt-4 mb-1.5">{children}</h3>,
        h4: ({ children }) => <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">{children}</h4>,
        p: ({ children }) => <p className="text-sm text-foreground leading-7 mb-3">{children}</p>,
        ul: ({ children }) => <ul className="my-2 ml-4 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="my-2 ml-4 space-y-1 list-decimal">{children}</ol>,
        li: ({ children }) => <li className="text-sm text-foreground leading-6 list-disc marker:text-primary">{children}</li>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/50 bg-primary/5 rounded-r-lg pl-4 pr-3 py-2 my-3 text-sm italic text-foreground">{children}</blockquote>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="text-muted-foreground">{children}</em>,
        code: ({ children, className }) => className?.includes("language-")
          ? <code className="block bg-secondary rounded-lg px-4 py-3 text-xs font-mono my-3 overflow-x-auto whitespace-pre">{children}</code>
          : <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>,
        pre: ({ children }) => <>{children}</>,
        hr: () => <hr className="my-4 border-border" />,
        table: ({ children }) => <div className="overflow-x-auto my-3"><table className="w-full text-sm border-collapse">{children}</table></div>,
        th: ({ children }) => <th className="bg-secondary text-left px-3 py-2 text-xs font-semibold border border-border">{children}</th>,
        td: ({ children }) => <td className="px-3 py-2 text-sm border border-border">{children}</td>,
        img: ({ src, alt }) => {
          const meta = parseNoteImageAlt(String(alt || ""));
          return (
            <figure className="my-5 overflow-hidden rounded-xl border border-border bg-secondary/10">
              <div className="relative bg-background flex justify-center py-2 select-none">
                <div className="relative">
                  <img
                    src={String(src || "")}
                    alt={meta.caption}
                    loading="lazy"
                    className="max-h-[420px] max-w-full w-auto h-auto block object-contain"
                  />
                  {meta.overlayLabels.length > 0 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {meta.overlayLabels.map((label: any, index: number) => {
                        const px = label.px !== undefined ? label.px : label.x;
                        const py = label.py !== undefined ? label.py : label.y;
                        const dist = Math.hypot(label.x - px, label.y - py);
                        if (dist < 0.005) return null;
                        return (
                          <g key={`line-${index}`}>
                            <line
                              x1={`${label.x * 100}%`}
                              y1={`${label.y * 100}%`}
                              x2={`${px * 100}%`}
                              y2={`${py * 100}%`}
                              stroke="rgba(99, 102, 241, 0.4)"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                            <line
                              x1={`${label.x * 100}%`}
                              y1={`${label.y * 100}%`}
                              x2={`${px * 100}%`}
                              y2={`${py * 100}%`}
                              stroke="#6366f1"
                              strokeWidth="1.5"
                              strokeDasharray="2,2"
                              strokeLinecap="round"
                            />
                            <circle
                              cx={`${px * 100}%`}
                              cy={`${py * 100}%`}
                              r="3.5"
                              fill="#4f46e5"
                              stroke="#ffffff"
                              strokeWidth="1"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  )}
                  {meta.overlayLabels.map((label: any, index: number) => (
                    <span
                      key={`${label.text}-${index}`}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-slate-950/85 px-2 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm pointer-events-auto"
                      style={{
                        left: `${Math.max(3, Math.min(97, label.x * 100))}%`,
                        top: `${Math.max(3, Math.min(97, label.y * 100))}%`,
                      }}
                    >
                      {label.text}
                    </span>
                  ))}
                </div>
              </div>
              <figcaption className="border-t border-border bg-background px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                <div className="font-semibold text-foreground">{meta.caption}</div>
              </figcaption>
            </figure>
          );
        },
      }}>{formatMarkdown(content)}</ReactMarkdown>
    </div>
  );
}

// ─── WYSIWYG Toolbar Button ────────────────────────────────────────────────────

function ToolBtn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={cn(
        "h-7 min-w-[28px] px-1.5 rounded flex items-center justify-center text-xs transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}>
      {children}
    </button>
  );
}

// ─── WYSIWYG Editor ──────────────────────────────────────────────────────────

function WysiwygEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing or editing lecture notes here…" }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "outline-none min-h-full px-8 py-6 text-sm leading-7 text-foreground",
      },
    },
  });

  if (!editor) return null;

  const btn = (action: () => void, active: boolean, title: string, label: React.ReactNode) => (
    <ToolBtn onClick={action} active={active} title={title}>{label}</ToolBtn>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-secondary/40 shrink-0">
        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">
          {btn(() => editor.chain().focus().setParagraph().run(), editor.isActive("paragraph"), "Paragraph", <span className="font-medium">P</span>)}
          {([1, 2, 3] as const).map(l => btn(
            () => editor.chain().focus().toggleHeading({ level: l }).run(),
            editor.isActive("heading", { level: l }),
            `Heading ${l}`,
            <span className="font-bold text-[11px]">H{l}</span>
          ))}
        </div>
        {/* Text formatting */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">
          {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), "Bold", <span className="font-bold">B</span>)}
          {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), "Italic", <span className="italic">I</span>)}
          {btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"), "Underline", <span className="underline">U</span>)}
          {btn(() => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"), "Strikethrough", <span className="line-through">S</span>)}
          {btn(() => editor.chain().focus().toggleHighlight().run(), editor.isActive("highlight"), "Highlight", <span className="bg-yellow-300 text-black px-0.5 rounded text-[10px]">H</span>)}
        </div>
        {/* Lists */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">
          {btn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"), "Bullet List",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>)}
          {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"), "Numbered List",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M10 6h11M10 12h11M10 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>)}
          {btn(() => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"), "Blockquote",
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" /></svg>)}
          {btn(() => editor.chain().focus().toggleCode().run(), editor.isActive("code"), "Inline Code",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>)}
        </div>
        {/* Text align */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">
          {btn(() => editor.chain().focus().setTextAlign("left").run(), editor.isActive({ textAlign: "left" }), "Align Left",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M3 6h18M3 12h12M3 18h15" /></svg>)}
          {btn(() => editor.chain().focus().setTextAlign("center").run(), editor.isActive({ textAlign: "center" }), "Align Center",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M3 6h18M6 12h12M4.5 18h15" /></svg>)}
        </div>
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          {btn(() => editor.chain().focus().undo().run(), false, "Undo",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6M3 10l6-6" /></svg>)}
          {btn(() => editor.chain().focus().redo().run(), false, "Redo",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>)}
        </div>
      </div>
      {/* Editor content */}
      <div className="flex-1 overflow-y-auto [&_.tiptap]:h-full">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}

// ─── AI Notes Review Panel ────────────────────────────────────────────────────

type NotesPanelTab = "preview" | "edit" | "transcript" | "quiz" | "analytics";

function NotesReviewPanel({ lecture, onClose, isGeneratingNotes }: { lecture: Lecture; onClose: () => void; isGeneratingNotes?: boolean }) {
  const updateLecture = useUpdateLecture();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<NotesPanelTab>("preview");
  const [htmlContent, setHtmlContent] = useState("");
  const [concepts, setConcepts] = useState<string[]>(lecture.aiKeyConcepts || []);
  const [newConcept, setNewConcept] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const youtubeSource = isYouTubeUrl(lecture.videoUrl);

  // Sync key-concepts from fresh data (but only if user hasn't locally edited)
  useEffect(() => {
    if (!hasChanges && lecture?.aiKeyConcepts) {
      setConcepts(lecture.aiKeyConcepts);
    }
  }, [lecture?.aiKeyConcepts, hasChanges]);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizCheckpoint[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [quizLoaded, setQuizLoaded] = useState(false);
  const [numQuizQuestions, setNumQuizQuestions] = useState(5);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<QuizCheckpoint | null>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<WatchAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Note image modal state
  const [imageModalMode, setImageModalMode] = useState<"delete" | "regenerate" | "edit-labels" | "edit-image" | null>(null);
  const [selectedImg, setSelectedImg] = useState<NoteImage | null>(null);
  const [isSavingLabels, setIsSavingLabels] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenCaption, setRegenCaption] = useState("");
  const [regenDesc, setRegenDesc] = useState("");
  const [editingLabels, setEditingLabels] = useState<OverlayLabel[]>([]);
  const [selectedLabelIndex, setSelectedLabelIndex] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [regenOption, setRegenOption] = useState<"choose" | "ai" | "manual">("choose");

  const [dragState, setDragState] = useState<{ index: number; target: "badge" | "pin" } | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  const [isAddingImage, setIsAddingImage] = useState(false);
  const [addImgCaption, setAddImgCaption] = useState("");
  const [addImgSection, setAddImgSection] = useState("");
  const [isUploadingAddImage, setIsUploadingAddImage] = useState(false);

  const noteImages = useMemo(() => {
    return extractImagesFromMarkdown(lecture.aiNotesMarkdown || "");
  }, [lecture.aiNotesMarkdown]);

  const handleSelectImage = (img: NoteImage) => {
    setSelectedImg(img);
    setRegenCaption(img.caption);
    setRegenDesc("");
    setEditingLabels(
      img.overlayLabels.map((lbl) => ({
        text: lbl.text,
        x: lbl.x,
        y: lbl.y,
        px: lbl.px !== undefined ? lbl.px : lbl.x,
        py: lbl.py !== undefined ? lbl.py : lbl.y,
      }))
    );
    setSelectedLabelIndex(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!dragState || !canvasWrapperRef.current) return;
    const rect = canvasWrapperRef.current.getBoundingClientRect();
    const mx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const my = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const updated = [...editingLabels];
    const item = updated[dragState.index];
    if (!item) return;

    if (dragState.target === "badge") {
      updated[dragState.index] = { ...item, x: mx, y: my };
    } else {
      updated[dragState.index] = { ...item, px: mx, py: my };
    }
    setEditingLabels(updated);
  };

  const handleCanvasMouseUp = () => {
    setDragState(null);
  };

  const handleDeleteImage = async () => {
    if (!selectedImg) return;
    setIsSaving(true);
    try {
      let notes = lecture.aiNotesMarkdown || "";
      notes = notes.replace(selectedImg.fullMatch, "");
      notes = notes.replace(/\n{3,}/g, "\n\n");

      await updateLecture.mutateAsync({
        id: lecture.id,
        aiNotesMarkdown: notes,
      } as any);

      toast({ title: "Visual deleted successfully" });
      setImageModalMode(null);
      setSelectedImg(null);
    } catch {
      toast({ title: "Failed to delete visual", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLabels = async () => {
    if (!selectedImg) return;
    setIsSavingLabels(true);
    try {
      let notes = lecture.aiNotesMarkdown || "";
      const newAlt = encodeNoteImageAlt(selectedImg.caption, editingLabels);
      const newImgBlock = `![${newAlt}](${selectedImg.url})`;
      notes = notes.replace(selectedImg.fullMatch, newImgBlock);

      await updateLecture.mutateAsync({
        id: lecture.id,
        aiNotesMarkdown: notes,
      } as any);

      toast({ title: "Labels saved successfully" });
      setImageModalMode(null);
      setSelectedImg(null);
    } catch {
      toast({ title: "Failed to save labels", variant: "destructive" });
    } finally {
      setIsSavingLabels(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!selectedImg) return;
    if (!regenCaption.trim() || !regenDesc.trim()) {
      toast({ title: "Caption and description are required", variant: "destructive" });
      return;
    }
    setIsRegenerating(true);
    try {
      await apiClient.post(`/content/lectures/${lecture.id}/regenerate-note-image`, {
        caption: regenCaption,
        visualDescription: regenDesc,
        oldImageUrl: selectedImg.url,
      });

      toast({ title: "Replacement image found successfully!" });
      queryClient.invalidateQueries({ queryKey: ["lecture", lecture.id] });
      setImageModalMode(null);
      setSelectedImg(null);
    } catch (err: any) {
      toast({
        title: "Regeneration failed",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleManualImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedImg) return;
    setUploadingImage(true);
    try {
      const contentType = (file.type && file.type.trim()) || guessImageMimeFromName(file.name);
      const url = await uploadToS3(
        {
          type: "doubt-response-image",
          contentType,
          fileName: file.name,
          fileSize: file.size,
        },
        file,
        undefined,
        selectedImg.url
      );

      const urlWithCacheBuster = url.split("?")[0] + "?v=" + Date.now();

      let notes = lecture.aiNotesMarkdown || "";
      const newAlt = encodeNoteImageAlt(regenCaption || selectedImg.caption, selectedImg.overlayLabels);
      const newImgBlock = `![${newAlt}](${urlWithCacheBuster})`;
      notes = notes.replace(selectedImg.fullMatch, newImgBlock);

      await updateLecture.mutateAsync({
        id: lecture.id,
        aiNotesMarkdown: notes,
      } as any);

      toast({ title: "Image uploaded and updated!" });
      setImageModalMode(null);
      setSelectedImg(null);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveEditedImage = async (blob: Blob) => {
    if (!selectedImg) return;
    setIsSavingImage(true);
    try {
      const file = new File([blob], "edited_diagram.png", { type: "image/png" });
      const url = await uploadToS3(
        {
          type: "doubt-response-image",
          contentType: "image/png",
          fileName: "edited_diagram.png",
          fileSize: file.size,
        },
        file,
        undefined,
        selectedImg.url
      );

      const urlWithCacheBuster = url.split("?")[0] + "?v=" + Date.now();

      let notes = lecture.aiNotesMarkdown || "";
      const newAlt = encodeNoteImageAlt(selectedImg.caption, selectedImg.overlayLabels);
      const newImgBlock = `![${newAlt}](${urlWithCacheBuster})`;
      notes = notes.replace(selectedImg.fullMatch, newImgBlock);

      await updateLecture.mutateAsync({
        id: lecture.id,
        aiNotesMarkdown: notes,
      } as any);

      toast({ title: "Image edited and saved successfully!" });
      setImageModalMode(null);
      setSelectedImg(null);
    } catch (err: any) {
      toast({ title: "Failed to save edited image", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleAddImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!addImgCaption.trim()) {
      toast({ title: "Figure caption is required", variant: "destructive" });
      return;
    }
    setIsUploadingAddImage(true);
    try {
      const contentType = (file.type && file.type.trim()) || guessImageMimeFromName(file.name);
      const url = await uploadToS3(
        {
          type: "doubt-response-image",
          contentType,
          fileName: file.name,
          fileSize: file.size,
        },
        file
      );

      const imgMarkdownBlock = `![${addImgCaption.trim()}](${url})\n*Figure: ${addImgCaption.trim()}*`;
      const updatedMarkdown = insertImageAfterSection(
        lecture.aiNotesMarkdown || "",
        addImgSection,
        imgMarkdownBlock
      );

      await updateLecture.mutateAsync({
        id: lecture.id,
        aiNotesMarkdown: updatedMarkdown,
      } as any);

      toast({ title: "Visual added successfully!" });
      setIsAddingImage(false);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingAddImage(false);
    }
  };

  const loadQuiz = async () => {
    if (quizLoaded) return;
    try {
      const qs = await getQuizCheckpoints(lecture.id);
      setQuizQuestions(qs);
      setQuizLoaded(true);
    } catch { /* ignore */ }
  };

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const data = await getWatchAnalytics(lecture.id);
      setAnalytics(data);
    } catch { toast({ title: "Failed to load analytics", variant: "destructive" }); }
    finally { setIsLoadingAnalytics(false); }
  };

  const handleTabChange = (t: NotesPanelTab) => {
    setTab(t);
    if (t === "quiz") loadQuiz();
    if (t === "analytics") loadAnalytics();
  };

  const handleGenerateQuiz = async () => {
    const notes = lecture.aiNotesMarkdown || "";
    const transcript = lecture.transcript || "";
    if (!notes.trim() && !transcript.trim()) {
      toast({
        title: "No content to generate from",
        description: youtubeSource
          ? "Upload notes or a transcript first using the 'Upload Notes' option on the lecture card."
          : "A transcript is required to generate quiz questions. Wait for processing to complete.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingQuiz(true);
    try {
      const courseLevel = lecture.batch?.name || lecture.topic?.chapter?.subject?.name || "General";
      const result = await generateQuizForLecture({
        notes,
        transcript,
        lectureTitle: lecture.title,
        topicId: lecture.topic?.id,
        numQuestions: numQuizQuestions,
        courseLevel,
        language: lecture.lectureLanguage || "en",
      });
      const qs: QuizCheckpoint[] = (result as any).questions ?? [];
      setQuizQuestions(qs);
      setQuizLoaded(true);
      await saveQuizCheckpoints(lecture.id, qs);
      const src = notes ? "notes" : "transcript";
      toast({ title: `${qs.length} quiz questions generated & saved!`, description: `Generated from lecture ${src}. Edit any question below.` });
    } catch (err: any) {
      toast({ title: "Quiz generation failed", description: err?.message, variant: "destructive" });
    } finally { setIsGeneratingQuiz(false); }
  };

  const handleSaveQuiz = async () => {
    setIsSavingQuiz(true);
    try {
      await saveQuizCheckpoints(lecture.id, quizQuestions);
      toast({ title: "Quiz saved!", description: "Students will see these questions while watching the video." });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setIsSavingQuiz(false); }
  };

  const removeQuestion = async (id: string) => {
    const updated = quizQuestions.filter(q => q.id !== id);
    setQuizQuestions(updated);
    try { await saveQuizCheckpoints(lecture.id, updated); }
    catch { toast({ title: "Delete failed", variant: "destructive" }); }
  };

  const startEdit = (q: QuizCheckpoint) => {
    setEditingId(q.id);
    setEditDraft({ ...q, options: q.options.map(o => ({ ...o })) });
  };

  const cancelEdit = () => { setEditingId(null); setEditDraft(null); };

  const saveEdit = async () => {
    if (!editDraft) return;
    const updated = quizQuestions.map(q => q.id === editDraft.id ? editDraft : q);
    setQuizQuestions(updated);
    setEditingId(null);
    setEditDraft(null);
    setIsSavingQuiz(true);
    try {
      await saveQuizCheckpoints(lecture.id, updated);
      toast({ title: "Question updated!" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setIsSavingQuiz(false); }
  };

  // Convert markdown to simple HTML for Tiptap initial load
  const initialHtml = useMemo(() => {
    const md = cleanAiMarkdown(lecture.aiNotesMarkdown || "");
    if (!md) return "";
    // Basic markdown → HTML conversion for Tiptap
    return md
      .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      .replace(/^(?!<[h|u|o|b|l])(.*\S.*)$/gm, "<p>$1</p>")
      .replace(/\n{2,}/g, "");
  }, [lecture.aiNotesMarkdown]);

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      await updateLecture.mutateAsync({
        id: lecture.id, status: "published" as any,
        aiNotesMarkdown: htmlContent || cleanAiMarkdown(lecture.aiNotesMarkdown || ""),
        aiKeyConcepts: concepts,
      } as any);
      toast({ title: "Lecture published!", description: "Students can now view this lecture and its notes." });
      onClose();
    } catch { toast({ title: "Publish failed", variant: "destructive" }); }
    finally { setIsSaving(false); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateLecture.mutateAsync({
        id: lecture.id,
        aiNotesMarkdown: htmlContent || cleanAiMarkdown(lecture.aiNotesMarkdown || ""),
        aiKeyConcepts: concepts,
      } as any);
      setHasChanges(false);
      toast({ title: "Notes saved" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setIsSaving(false); }
  };

  const addConcept = () => {
    const c = newConcept.trim();
    if (c && !concepts.includes(c)) { setConcepts([...concepts, c]); setHasChanges(true); }
    setNewConcept("");
  };

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className="fixed inset-0 z-[200] flex justify-end">
      <div className="flex-1 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-4xl bg-card border-l border-border flex flex-col h-full shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Lecture Notes
            </p>
            <h2 className="font-bold text-foreground mt-0.5 truncate">{lecture.title}</h2>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {hasChanges && (
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5 h-8 text-xs">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                Save
              </Button>
            )}
            <Button onClick={handlePublish} disabled={isSaving} size="sm" className="gap-1.5 h-8">
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Publish Lecture
            </Button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-1"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 px-4 border-b border-border bg-secondary/20 shrink-0 overflow-x-auto">
          {([
            { id: "preview" as NotesPanelTab, label: "Preview", icon: Eye },
            { id: "edit" as NotesPanelTab, label: "Edit", icon: Edit3 },
            { id: "transcript" as NotesPanelTab, label: "Transcript", icon: Mic },
            { id: "quiz" as NotesPanelTab, label: "Quiz", icon: HelpCircle },
            { id: "analytics" as NotesPanelTab, label: "Analytics", icon: BarChart2 },
          ]).map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        {/* Key Concepts */}
        <div className="px-6 py-2.5 border-b border-border bg-secondary/10 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Concepts:</span>
            {concepts.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {c}
                <button onClick={() => { setConcepts(concepts.filter((_, j) => j !== i)); setHasChanges(true); }}
                  className="hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
            <input value={newConcept} onChange={e => setNewConcept(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addConcept(); } }}
              placeholder="+ Add…"
              className="h-5 w-20 text-[11px] px-2 bg-transparent border-b border-dashed border-border outline-none focus:border-primary placeholder:text-muted-foreground/50" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {/* PREVIEW */}
          {tab === "preview" && (
            <div className="h-full overflow-y-auto px-8 py-6">
              {lecture.aiNotesMarkdown ? (
                <>
                  {/* Manage Visuals Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-border">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-2">Manage Visuals:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setImageModalMode("delete"); setSelectedImg(null); }}
                      className="h-8 text-xs gap-1.5 text-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Visual
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setImageModalMode("regenerate"); setSelectedImg(null); setRegenOption("choose"); }}
                      className="h-8 text-xs gap-1.5 text-foreground hover:text-violet-600"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Regenerate Visual
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setImageModalMode("edit-labels"); setSelectedImg(null); }}
                      className="h-8 text-xs gap-1.5 text-foreground hover:text-primary"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Labels
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setImageModalMode("edit-image"); setSelectedImg(null); }}
                      className="h-8 text-xs gap-1.5 text-foreground hover:text-indigo-600"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Edit Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setIsAddingImage(true); setAddImgCaption(""); setAddImgSection(""); }}
                      className="h-8 text-xs gap-1.5 text-foreground hover:text-emerald-600"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Visual in Place
                    </Button>
                  </div>
                  <MarkdownContent content={cleanAiMarkdown(lecture.aiNotesMarkdown)} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  {(lecture.transcriptStatus === "processing" || lecture.transcriptStatus === "pending") ? (
                    <>
                      <Loader2 className="w-12 h-12 opacity-60 text-primary animate-spin" />
                      <p className="text-sm text-foreground">Generating AI notes…</p>
                      <p className="text-xs text-center max-w-sm">
                        {youtubeSource
                          ? "Pulling YouTube captions and summarising."
                          : lecture.lectureLanguage === "hinglish" || lecture.lectureLanguage === "hi"
                            ? "Transcribing audio → translating to English → generating notes. This may take 5–10 minutes."
                            : "Transcribing audio and generating notes."}
                      </p>
                    </>
                  ) : isGeneratingNotes ? (
                    <>
                      <Loader2 className="w-12 h-12 opacity-60 text-violet-500 animate-spin" />
                      <p className="text-sm text-foreground">Generating notes from transcript…</p>
                      <p className="text-xs text-center max-w-sm text-muted-foreground">
                        AI is reading the transcript and building structured notes. This takes 30–60 seconds — the panel will update automatically.
                      </p>
                    </>
                  ) : lecture.transcriptStatus === "failed" ? (
                    <>
                      <AlertTriangle className="w-12 h-12 opacity-60 text-amber-500" />
                      <p className="text-sm text-foreground">AI notes could not be generated</p>
                      <p className="text-xs text-center max-w-sm">
                        {youtubeSource ? YOUTUBE_LECTURE_CAPTIONS_HINT : "Check the video URL and try re-transcribe from the lecture list."}
                      </p>
                    </>
                  ) : (
                    <>
                      <FileText className="w-12 h-12 opacity-20" />
                      <p className="text-sm">No notes available yet.</p>
                      {youtubeSource && lecture.transcript && (
                        <p className="text-xs text-center max-w-sm text-muted-foreground">Transcript is ready — try refreshing, or edit notes manually.</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* WYSIWYG EDIT */}
          {tab === "edit" && (
            <WysiwygEditor
              content={initialHtml}
              onChange={html => { setHtmlContent(html); setHasChanges(true); }}
            />
          )}

          {/* TRANSCRIPT */}
          {tab === "transcript" && (
            <div className="h-full overflow-y-auto px-8 py-6">
              {lecture.transcriptStatus === "processing" && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-blue-500">
                  <Loader2 className="w-10 h-10 animate-spin opacity-60" />
                  <p className="text-sm font-medium">Transcription in progress…</p>
                  <p className="text-xs text-muted-foreground">This usually takes 2-5 minutes. Refresh the page to check.</p>
                </div>
              )}
              {lecture.transcriptStatus === "failed" && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-red-500">
                  <XCircle className="w-10 h-10 opacity-60" />
                  <p className="text-sm font-medium">Transcription failed</p>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">The AI could not transcribe this video. Check that the video URL is accessible, then retry.</p>
                  <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-500/30 hover:bg-red-500/10"
                    onClick={async () => {
                      try {
                        await retranscribeLecture(lecture.id);
                        toast({ title: "Transcription started", description: "Re-transcribing the lecture…" });
                      } catch { toast({ title: "Failed", variant: "destructive" }); }
                    }}>
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Transcription
                  </Button>
                </div>
              )}
              {!lecture.transcriptStatus || (lecture.transcriptStatus !== "processing" && lecture.transcriptStatus !== "failed") ? (
                lecture.transcript ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mic className="w-3.5 h-3.5 text-primary" />
                      <span>
                        Auto-transcribed ·{" "}
                        {lecture.transcriptLanguage === "hinglish"
                          ? "Hinglish → translated to English"
                          : lecture.transcriptLanguage === "hi"
                            ? "Hindi → translated to English"
                            : "English"}
                      </span>
                    </div>
                    <div className="bg-secondary/30 rounded-xl p-4 sm:p-5">
                      <div className="space-y-3">
                        {toTranscriptParagraphs(lecture.transcript).map((para, idx) => (
                          <p key={idx} className="text-sm text-foreground leading-7">
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                    {(lecture.transcriptStatus === "processing" || lecture.transcriptStatus === "pending") ? (
                      <>
                        <Loader2 className="w-12 h-12 opacity-60 text-primary animate-spin" />
                        <p className="text-sm text-foreground">Preparing transcript…</p>
                        <p className="text-xs text-center max-w-sm">
                          {youtubeSource
                            ? "Fetching captions from YouTube."
                            : lecture.lectureLanguage === "hinglish" || lecture.lectureLanguage === "hi"
                              ? "Transcribing Hinglish audio and translating to English via Sarvam AI."
                              : "Transcribing uploaded video."}
                        </p>
                      </>
                    ) : isGeneratingNotes ? (
                      <>
                        <Loader2 className="w-12 h-12 opacity-60 text-violet-500 animate-spin" />
                        <p className="text-sm text-foreground">Generating notes from transcript…</p>
                        <p className="text-xs text-center max-w-sm text-muted-foreground">
                          AI is reading the transcript and building structured notes. This takes 30–60 seconds — the panel will update automatically.
                        </p>
                      </>
                    ) : lecture.transcriptStatus === "failed" ? (
                      <>
                        <AlertTriangle className="w-12 h-12 opacity-60 text-amber-500" />
                        <p className="text-sm text-foreground">Transcript unavailable</p>
                        <p className="text-xs text-center max-w-sm">
                          {youtubeSource ? YOUTUBE_LECTURE_CAPTIONS_HINT : "Check the video URL and try again from the lecture list."}
                        </p>
                      </>
                    ) : (
                      <>
                        <Mic className="w-12 h-12 opacity-20" />
                        <p className="text-sm">Transcript not available.</p>
                        <p className="text-xs text-center max-w-sm">
                          {youtubeSource ? YOUTUBE_LECTURE_CAPTIONS_HINT : "Upload a video to generate a transcript automatically."}
                        </p>
                      </>
                    )}
                  </div>
                )
              ) : null}
            </div>
          )}

          {/* QUIZ */}
          {tab === "quiz" && (
            <div className="h-full overflow-y-auto px-6 py-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">In-Video Quiz Checkpoints</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Questions pop up for students at the right moments while watching</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {quizQuestions.length > 0 && (
                    <Button size="sm" variant="outline" onClick={handleSaveQuiz} disabled={isSavingQuiz} className="gap-1.5 h-8 text-xs">
                      {isSavingQuiz ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Save Quiz
                    </Button>
                  )}
                  <select
                    value={numQuizQuestions}
                    onChange={e => setNumQuizQuestions(Number(e.target.value))}
                    disabled={isGeneratingQuiz}
                    className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-primary disabled:opacity-50"
                    title="Number of quiz questions"
                  >
                    {[3, 5, 8, 10, 15].map(n => (
                      <option key={n} value={n}>{n} questions</option>
                    ))}
                  </select>
                  <Button size="sm" onClick={handleGenerateQuiz} disabled={isGeneratingQuiz || (!lecture.transcript && !lecture.aiNotesMarkdown)} className="gap-1.5 h-8 text-xs">
                    {isGeneratingQuiz ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {isGeneratingQuiz ? "Generating…" : quizQuestions.length > 0 ? "Regenerate" : "Generate Quiz"}
                  </Button>
                </div>
              </div>

              {/* Source indicator — notes always preferred over transcript */}
              {lecture.aiNotesMarkdown ? (
                <div className="flex items-center gap-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 text-xs text-violet-700 dark:text-violet-400">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Quiz will be generated strictly from the AI notes — questions will cover all sections evenly.</span>
                </div>
              ) : lecture.transcript ? (
                <div className="flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-400">
                  <Mic className="w-4 h-4 shrink-0" />
                  <span>No notes available — quiz will be generated from the transcript. Generate AI notes first for better quality questions.</span>
                </div>
              ) : null}
              {!lecture.transcript && !lecture.aiNotesMarkdown && (
                <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                  <Mic className="w-4 h-4 shrink-0" />
                  <span>
                    {youtubeSource
                      ? "Upload notes first using 'Upload Notes' on the lecture card — quiz can then be generated from them."
                      : "A transcript is needed to generate quiz questions. Wait for processing or upload a captioned video."}
                  </span>
                </div>
              )}

              {quizQuestions.length === 0 && !isGeneratingQuiz && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <HelpCircle className="w-12 h-12 opacity-20" />
                  <p className="text-sm">No quiz questions yet.</p>
                  <p className="text-xs">
                    {lecture.transcript || lecture.aiNotesMarkdown
                      ? `Click "Generate Quiz" to create questions from the ${lecture.transcript ? "transcript" : "uploaded notes"}.`
                      : 'Upload notes or wait for transcript processing, then click "Generate Quiz".'}
                  </p>
                </div>
              )}

              {isGeneratingQuiz && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  <p className="text-sm font-medium">AI is generating quiz questions…</p>
                  <p className="text-xs">Analysing transcript for key concepts and topic boundaries</p>
                </div>
              )}

              <div className="space-y-3">
                {quizQuestions.map((q, i) => {
                  const isEditing = editingId === q.id;

                  if (isEditing && editDraft) {
                    // ── Edit mode ──
                    return (
                      <div key={q.id} className="bg-primary/5 border border-primary/30 rounded-xl p-4 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Q{i + 1}</span>
                          <span className="text-xs font-semibold text-primary">Editing</span>
                        </div>

                        {/* Question text */}
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Question</label>
                          <textarea
                            value={editDraft.questionText}
                            onChange={e => setEditDraft(d => d ? { ...d, questionText: e.target.value } : d)}
                            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary resize-none"
                            rows={2}
                          />
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Options — click radio to mark correct</label>
                          {editDraft.options.map((opt, oi) => (
                            <div key={opt.label} className={cn("flex items-center gap-2 border rounded-lg px-3 py-2 transition-colors",
                              editDraft.correctOption === opt.label
                                ? "border-emerald-500/50 bg-emerald-500/8"
                                : "border-border bg-background")}>
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={editDraft.correctOption === opt.label}
                                onChange={() => setEditDraft(d => d ? { ...d, correctOption: opt.label } : d)}
                                className="shrink-0 accent-emerald-500"
                              />
                              <span className={cn("text-xs font-bold w-4 shrink-0", editDraft.correctOption === opt.label ? "text-emerald-600" : "text-muted-foreground")}>{opt.label}.</span>
                              <input
                                value={opt.text}
                                onChange={e => setEditDraft(d => d ? {
                                  ...d, options: d.options.map((o, j) => j === oi ? { ...o, text: e.target.value } : o)
                                } : d)}
                                className="flex-1 text-sm bg-transparent outline-none focus:ring-0 placeholder:text-muted-foreground/50"
                                placeholder={`Option ${opt.label}`}
                              />
                              {editDraft.correctOption === opt.label && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                            </div>
                          ))}
                        </div>

                        {/* Trigger % + Segment title */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Show at % of video</label>
                            <input
                              type="number" min={0} max={100}
                              value={editDraft.triggerAtPercent}
                              onChange={e => setEditDraft(d => d ? { ...d, triggerAtPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) } : d)}
                              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Segment Title</label>
                            <input
                              value={editDraft.segmentTitle}
                              onChange={e => setEditDraft(d => d ? { ...d, segmentTitle: e.target.value } : d)}
                              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-primary"
                              placeholder="e.g. Introduction"
                            />
                          </div>
                        </div>

                        {/* Explanation */}
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Explanation (optional)</label>
                          <textarea
                            value={editDraft.explanation ?? ""}
                            onChange={e => setEditDraft(d => d ? { ...d, explanation: e.target.value || undefined } : d)}
                            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary resize-none"
                            rows={2}
                            placeholder="Why is this the correct answer?"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 text-xs">Cancel</Button>
                          <Button size="sm" onClick={saveEdit} disabled={isSavingQuiz} className="h-8 text-xs gap-1.5">
                            {isSavingQuiz ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  // ── View mode ──
                  return (
                    <div key={q.id} className="bg-secondary/40 border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Q{i + 1}</span>
                            <span className="text-[10px] text-muted-foreground">at {q.triggerAtPercent}% · {q.segmentTitle}</span>
                          </div>
                          <MarkdownRenderer content={q.questionText} className="prose-p:my-0 text-sm font-medium text-foreground" />
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => startEdit(q)} title="Edit question"
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/10">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeQuestion(q.id)} title="Delete question"
                            className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {q.options.map(opt => (
                          <div key={opt.label}
                            className={cn("px-2.5 py-1.5 rounded-lg text-xs border flex items-center gap-1.5",
                              q.correctOption === opt.label
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
                                : "border-border text-muted-foreground"
                            )}>
                            <span className="font-bold shrink-0">{opt.label}.</span>
                            <span className="min-w-0 flex-1 truncate">
                              <MarkdownRenderer content={opt.text} className="prose-p:my-0 text-xs" />
                            </span>
                            {q.correctOption === opt.label && <CheckCircle className="w-3 h-3 shrink-0 ml-auto" />}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2 leading-5">
                          <span className="mr-1">Idea:</span>
                          <MarkdownRenderer content={q.explanation} className="inline prose-p:my-0 text-xs text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {tab === "analytics" && (
            <div className="h-full overflow-y-auto px-6 py-5 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Student Watch Analytics</p>
                <button onClick={loadAnalytics} disabled={isLoadingAnalytics}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoadingAnalytics && "animate-spin")} />
                  Refresh
                </button>
              </div>

              {isLoadingAnalytics && (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              {!isLoadingAnalytics && !analytics && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <BarChart2 className="w-12 h-12 opacity-20" />
                  <p className="text-sm">No data yet. Publish the lecture so students can watch it.</p>
                </div>
              )}

              {analytics && (
                <div className="space-y-5">
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total Watchers", value: analytics.totalWatchers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                      { label: "Completed", value: analytics.students.filter(s => s.isCompleted).length, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                      {
                        label: "Quiz Avg", value: analytics.students.filter(s => s.quizScore !== null).length > 0
                          ? `${Math.round(analytics.students.filter(s => s.quizScore !== null).reduce((a, s) => a + (s.quizScore ?? 0), 0) / analytics.students.filter(s => s.quizScore !== null).length)}%`
                          : "—",
                        icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10"
                      },
                    ].map(s => (
                      <div key={s.label} className="bg-secondary/50 rounded-xl p-3 text-center">
                        <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-1.5`}>
                          <s.icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                        <p className="text-lg font-bold text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Per-question accuracy */}
                  {analytics.questionStats.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quiz Performance</p>
                      <div className="space-y-2">
                        {analytics.questionStats.map((qs, i) => (
                          <div key={qs.questionId} className="bg-secondary/40 rounded-xl px-4 py-3">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <p className="text-xs font-medium text-foreground truncate flex-1">{qs.questionText}</p>
                              <span className={cn("text-xs font-bold shrink-0",
                                qs.accuracy === null ? "text-muted-foreground" :
                                  qs.accuracy >= 70 ? "text-emerald-500" : qs.accuracy >= 40 ? "text-amber-500" : "text-red-500"
                              )}>
                                {qs.accuracy !== null ? `${qs.accuracy}%` : "—"}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full",
                                  (qs.accuracy ?? 0) >= 70 ? "bg-emerald-500" : (qs.accuracy ?? 0) >= 40 ? "bg-amber-500" : "bg-red-500"
                                )}
                                style={{ width: `${qs.accuracy ?? 0}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {qs.correctCount}/{qs.totalAttempts} correct · {qs.segmentTitle}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per-student table */}
                  {analytics.students.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Students</p>
                      <div className="space-y-2">
                        {analytics.students.sort((a, b) => b.watchPercentage - a.watchPercentage).map(s => (
                          <div key={s.studentId} className="flex items-center gap-3 bg-secondary/40 rounded-xl px-4 py-3">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {s.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{s.studentName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${s.watchPercentage}%` }} />
                                </div>
                                <span className="text-[10px] text-muted-foreground shrink-0">{Math.round(s.watchPercentage)}%</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {s.quizScore !== null ? (
                                <span className={cn("text-xs font-bold",
                                  s.quizScore >= 70 ? "text-emerald-500" : s.quizScore >= 40 ? "text-amber-500" : "text-red-500"
                                )}>
                                  {s.quizScore}%
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                              <p className="text-[10px] text-muted-foreground">{s.isCompleted ? "✓ Done" : "In progress"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border shrink-0 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {lecture.status === "published" ? "✓ Published — visible to students." : "Review notes carefully before publishing."}
          </p>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Save Changes
              </Button>
            )}
            <Button onClick={handlePublish} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {lecture.status === "published" ? "Update & Republish" : "Publish Lecture"}
            </Button>
          </div>
        </div>

        {/* Note Image Actions Modal */}
        {imageModalMode && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {imageModalMode === "delete" ? (
                      <Trash2 className="w-4 h-4 text-destructive" />
                    ) : imageModalMode === "regenerate" ? (
                      <RefreshCw className="w-4 h-4 text-violet-500" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">
                      {imageModalMode === "delete"
                        ? "Delete Visual"
                        : imageModalMode === "regenerate"
                          ? "Regenerate Visual via AI"
                          : imageModalMode === "edit-image"
                            ? "Edit Diagram Image"
                            : "Edit Image Labels"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedImg
                        ? selectedImg.caption
                        : "Select an image from the lecture notes to modify"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setImageModalMode(null)}
                  className="w-8 h-8 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center shrink-0 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                {!selectedImg ? (
                  // Grid of note images
                  noteImages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No images found in notes</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {noteImages.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectImage(img)}
                          className="group border border-border/80 hover:border-primary/50 rounded-xl p-3 bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-all duration-200 shadow-sm flex flex-col gap-2"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 bg-background flex items-center justify-center">
                            <img
                              src={img.url}
                              alt={img.caption}
                              className="max-h-full max-w-full object-contain group-hover:scale-[1.03] transition-transform duration-200"
                            />
                          </div>
                          <span className="text-xs font-semibold text-foreground truncate block text-center mt-1">
                            {img.caption}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  // Image is selected
                  <div className="space-y-5">
                    {/* Mode specific contents */}
                    {imageModalMode === "delete" && (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex gap-3 text-destructive">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <div className="text-xs leading-5">
                            <p className="font-semibold">Confirm Deletion</p>
                            <p className="mt-0.5">Are you sure you want to delete this educational visual? This will permanently remove the image markdown block and its caption figure from the lecture notes.</p>
                          </div>
                        </div>
                        <div className="max-h-[220px] rounded-xl border border-border overflow-hidden bg-background flex items-center justify-center p-3">
                          <img src={selectedImg.url} alt={selectedImg.caption} className="max-h-[200px] object-contain" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedImg(null)} disabled={isSaving}>
                            Back
                          </Button>
                          <Button variant="destructive" size="sm" onClick={handleDeleteImage} disabled={isSaving} className="gap-1.5">
                            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Confirm Delete
                          </Button>
                        </div>
                      </div>
                    )}

                    {imageModalMode === "regenerate" && (
                      <div className="space-y-4">
                        {regenOption === "choose" && (
                          <div className="space-y-6 py-4">
                            <p className="text-sm text-foreground text-center font-medium">
                              How would you like to regenerate this visual?
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <button
                                onClick={() => setRegenOption("ai")}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-border bg-secondary/10 hover:bg-primary/5 hover:border-primary/50 transition-all group gap-3 text-center"
                              >
                                <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-foreground block">Find a Replacement Image</span>
                                  <span className="text-xs text-muted-foreground mt-1 block">Describe the concept and search for a relevant educational visual</span>
                                </div>
                              </button>
                              <button
                                onClick={() => setRegenOption("manual")}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-border bg-secondary/10 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 hover:border-emerald-500/50 transition-all group gap-3 text-center"
                              >
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Upload className="w-6 h-6" />
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-foreground block">Manually Upload Image</span>
                                  <span className="text-xs text-muted-foreground mt-1 block">Select a local image file and upload it to replace the current visual</span>
                                </div>
                              </button>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-border">
                              <Button variant="outline" size="sm" onClick={() => setSelectedImg(null)}>
                                Back
                              </Button>
                            </div>
                          </div>
                        )}

                        {regenOption === "ai" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-foreground">Figure Caption *</Label>
                                  <Input
                                    value={regenCaption}
                                    onChange={(e) => setRegenCaption(e.target.value)}
                                    className="h-9 text-xs"
                                    placeholder="Enter a descriptive caption..."
                                  />
                                </div>
                                <div className="space-y-1.5 flex-1 flex flex-col">
                                  <Label className="text-xs font-semibold text-foreground">Image Search Description *</Label>
                                  <textarea
                                    value={regenDesc}
                                    onChange={(e) => setRegenDesc(e.target.value)}
                                    className="flex-1 text-xs min-h-[120px] resize-none border border-border rounded-xl focus:border-primary outline-none p-3 bg-secondary/10"
                                    placeholder="Describe the educational image to find (e.g. labeled plant cell diagram, water cycle illustration)..."
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col justify-center items-center gap-2 border border-border/60 rounded-xl p-3 bg-secondary/10">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase self-start">Current Visual:</span>
                                <div className="relative aspect-video rounded-lg border overflow-hidden bg-background w-full flex items-center justify-center p-1.5">
                                  <img src={selectedImg.url} alt={selectedImg.caption} className="max-h-full max-w-full object-contain" />
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center italic mt-1">A relevant educational image will be found through image search and stored securely for these notes.</p>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-border shrink-0">
                              <Button variant="outline" size="sm" onClick={() => setRegenOption("choose")} disabled={isRegenerating}>
                                Back
                              </Button>
                              <Button variant="default" size="sm" onClick={handleRegenerateImage} disabled={isRegenerating} className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white border-none">
                                {isRegenerating ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Searching Images...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Find Replacement
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {regenOption === "manual" && (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Figure Caption *</Label>
                              <Input
                                value={regenCaption}
                                onChange={(e) => setRegenCaption(e.target.value)}
                                className="h-9 text-xs"
                                placeholder="Enter a descriptive caption..."
                              />
                            </div>

                            <div className="relative border-2 border-dashed border-border hover:border-emerald-500/50 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-secondary/10 hover:bg-secondary/20 transition-all cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleManualImageUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={uploadingImage}
                              />
                              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                <Upload className="w-5 h-5" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-semibold text-foreground">Click to upload or drag and drop</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, GIF up to 5MB</p>
                              </div>
                            </div>

                            {uploadingImage && (
                              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span>Uploading image to S3...</span>
                              </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t border-border">
                              <Button variant="outline" size="sm" onClick={() => setRegenOption("choose")} disabled={uploadingImage}>
                                Back
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {imageModalMode === "edit-labels" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          {/* Image preview with labels plotted on top */}
                          <div className="md:col-span-3 flex flex-col gap-2">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Interactive Canvas:</span>
                            <div
                              className="relative border border-border rounded-xl overflow-hidden bg-background h-[320px] flex items-center justify-center select-none shadow-inner"
                              onMouseMove={handleCanvasMouseMove}
                              onMouseUp={handleCanvasMouseUp}
                              onMouseLeave={handleCanvasMouseUp}
                            >
                              <div ref={canvasWrapperRef} className="relative">
                                <img
                                  src={selectedImg.url}
                                  alt={selectedImg.caption}
                                  className="max-h-[300px] max-w-full w-auto h-auto block cursor-crosshair"
                                  onClick={(e) => {
                                    if (dragState) return; // Prevent clicking while dragging
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = (e.clientX - rect.left) / rect.width;
                                    const y = (e.clientY - rect.top) / rect.height;

                                    if (selectedLabelIndex !== null && editingLabels[selectedLabelIndex]) {
                                      const updated = [...editingLabels];
                                      updated[selectedLabelIndex] = {
                                        ...updated[selectedLabelIndex],
                                        px: x,
                                        py: y
                                      };
                                      setEditingLabels(updated);
                                    } else {
                                      const text = prompt("Enter label text:") || "";
                                      if (text.trim()) {
                                        const newLabel: OverlayLabel = {
                                          text: text.trim(),
                                          x,
                                          y,
                                          px: x,
                                          py: y
                                        };
                                        setEditingLabels([...editingLabels, newLabel]);
                                        setSelectedLabelIndex(editingLabels.length);
                                      }
                                    }
                                  }}
                                />

                                {/* SVG connecting lines inside the editor */}
                                {editingLabels.length > 0 && (
                                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    {editingLabels.map((lbl, idx) => {
                                      const px = lbl.px !== undefined ? lbl.px : lbl.x;
                                      const py = lbl.py !== undefined ? lbl.py : lbl.y;
                                      const dist = Math.hypot(lbl.x - px, lbl.y - py);
                                      if (dist < 0.005) return null;
                                      return (
                                        <g key={`edit-line-${idx}`}>
                                          <line
                                            x1={`${lbl.x * 100}%`}
                                            y1={`${lbl.y * 100}%`}
                                            x2={`${px * 100}%`}
                                            y2={`${py * 100}%`}
                                            stroke="rgba(99, 102, 241, 0.4)"
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                          />
                                          <line
                                            x1={`${lbl.x * 100}%`}
                                            y1={`${lbl.y * 100}%`}
                                            x2={`${px * 100}%`}
                                            y2={`${py * 100}%`}
                                            stroke="#6366f1"
                                            strokeWidth="1.5"
                                            strokeDasharray="2,2"
                                            strokeLinecap="round"
                                          />
                                        </g>
                                      );
                                    })}
                                  </svg>
                                )}

                                {/* Target spots/pins */}
                                {editingLabels.map((lbl, idx) => {
                                  const px = lbl.px !== undefined ? lbl.px : lbl.x;
                                  const py = lbl.py !== undefined ? lbl.py : lbl.y;
                                  return (
                                    <div
                                      key={`edit-pin-${idx}`}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setSelectedLabelIndex(idx);
                                        setDragState({ index: idx, target: "pin" });
                                      }}
                                      className={cn(
                                        "absolute -translate-x-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full flex items-center justify-center cursor-move transition-transform hover:scale-125 z-40 select-none",
                                        selectedLabelIndex === idx ? "scale-110" : ""
                                      )}
                                      style={{
                                        left: `${px * 100}%`,
                                        top: `${py * 100}%`,
                                      }}
                                      title="Drag to reposition target spot"
                                    >
                                      <div className={cn(
                                        "w-2.5 h-2.5 rounded-full border border-white shadow-md transition-colors",
                                        selectedLabelIndex === idx ? "bg-emerald-500 ring-2 ring-emerald-500/30" : "bg-indigo-500"
                                      )} />
                                    </div>
                                  );
                                })}

                                {/* Draggable Label badges */}
                                {editingLabels.map((lbl, idx) => (
                                  <span
                                    key={`edit-badge-${idx}`}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setSelectedLabelIndex(idx);
                                      setDragState({ index: idx, target: "badge" });
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedLabelIndex(idx);
                                    }}
                                    className={cn(
                                      "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-0.5 text-[9px] font-bold leading-none cursor-move shadow-md select-none transition-all duration-150 z-50",
                                      selectedLabelIndex === idx
                                        ? "border-primary bg-primary text-primary-foreground scale-110 ring-2 ring-primary/30"
                                        : "border-white/80 bg-slate-950/85 text-white hover:bg-slate-900"
                                    )}
                                    style={{
                                      left: `${lbl.x * 100}%`,
                                      top: `${lbl.y * 100}%`,
                                    }}
                                  >
                                    {lbl.text}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic text-center">Click empty space to place a new label. Drag the label badge or the target pin to reposition them. Use the sidebar to edit text or delete labels.</p>
                          </div>

                          {/* Side list/control fields */}
                          <div className="md:col-span-2 flex flex-col gap-2 h-[350px]">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Labels ({editingLabels.length}):</span>
                              <div className="flex gap-1.5">
                                {selectedLabelIndex !== null && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedLabelIndex(null)}
                                    className="h-7 px-2 text-[10px] hover:bg-secondary/80 text-muted-foreground"
                                  >
                                    Deselect
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingLabels([...editingLabels, { text: "New Label", x: 0.5, y: 0.5, px: 0.5, py: 0.5 }]);
                                    setSelectedLabelIndex(editingLabels.length);
                                  }}
                                  className="h-7 px-2 text-[10px] gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Label
                                </Button>
                              </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 border border-border/80 rounded-xl p-2.5 bg-secondary/10 min-h-0">
                              {editingLabels.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground text-center py-12">No labels. Click "+ Add Label" or click the image to add labels.</p>
                              ) : (
                                editingLabels.map((lbl, idx) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "border rounded-lg p-2 flex flex-col gap-1.5 transition-colors",
                                      selectedLabelIndex === idx
                                        ? "border-primary/50 bg-primary/5"
                                        : "border-border bg-background"
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-1.5">
                                      <input
                                        type="text"
                                        value={lbl.text}
                                        onChange={(e) => {
                                          const updated = [...editingLabels];
                                          updated[idx].text = e.target.value;
                                          setEditingLabels(updated);
                                        }}
                                        onClick={() => setSelectedLabelIndex(idx)}
                                        className="h-7 w-full px-2 text-[11px] border border-border rounded bg-background focus:border-primary outline-none"
                                        placeholder="Label text..."
                                      />
                                      <button
                                        onClick={() => {
                                          setEditingLabels(editingLabels.filter((_, i) => i !== idx));
                                          if (selectedLabelIndex === idx) setSelectedLabelIndex(null);
                                        }}
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive flex items-center justify-center hover:bg-destructive/5 rounded"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <div className="flex gap-2 text-[9px] text-muted-foreground font-semibold">
                                      <div className="flex-1 flex items-center gap-1">
                                        <span>X:</span>
                                        <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          value={Math.round(lbl.x * 100)}
                                          onChange={(e) => {
                                            const updated = [...editingLabels];
                                            updated[idx].x = parseInt(e.target.value) / 100;
                                            setEditingLabels(updated);
                                          }}
                                          className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span>{Math.round(lbl.x * 100)}%</span>
                                      </div>
                                      <div className="flex-1 flex items-center gap-1">
                                        <span>Y:</span>
                                        <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          value={Math.round(lbl.y * 100)}
                                          onChange={(e) => {
                                            const updated = [...editingLabels];
                                            updated[idx].y = parseInt(e.target.value) / 100;
                                            setEditingLabels(updated);
                                          }}
                                          className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span>{Math.round(lbl.y * 100)}%</span>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-border shrink-0">
                          <Button variant="outline" size="sm" onClick={() => setSelectedImg(null)} disabled={isSavingLabels}>
                            Back
                          </Button>
                          <Button variant="default" size="sm" onClick={handleSaveLabels} disabled={isSavingLabels} className="gap-1.5">
                            {isSavingLabels && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Save Labels
                          </Button>
                        </div>
                      </div>
                    )}

                    {imageModalMode === "edit-image" && selectedImg && (
                      <ImageEditorCanvas
                        imageUrl={selectedImg.url}
                        onSave={handleSaveEditedImage}
                        onCancel={() => setSelectedImg(null)}
                        isSaving={isSavingImage}
                      />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Visual in Place Modal */}
        {isAddingImage && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">Add Visual in Place</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Upload a manual image and choose where to insert it in the notes</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddingImage(false)}
                  className="w-8 h-8 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center shrink-0 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Figure Caption *</Label>
                  <Input
                    value={addImgCaption}
                    onChange={(e) => setAddImgCaption(e.target.value)}
                    className="h-9 text-xs"
                    placeholder="Enter a descriptive caption for the figure..."
                  />
                </div>

                {/* Section Picker */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Insertion Location</Label>
                  <CustomSelect
                    onChange={setAddImgSection}
                    value={addImgSection}
                    options={[
                      { value: "", label: "At the very end of notes" },
                    ]}
                    className="w-full"
                  />
                </div>

                {/* Drag and Drop File Picker */}
                <div className="relative border-2 border-dashed border-border hover:border-emerald-500/50 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-secondary/10 hover:bg-secondary/20 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploadingAddImage}
                  />
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">Click to upload or drag and drop</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>

                {isUploadingAddImage && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Uploading image to S3...</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 p-4 border-t border-border shrink-0 bg-secondary/10">
                <Button variant="outline" size="sm" onClick={() => setIsAddingImage(false)} disabled={isUploadingAddImage}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Live Stats Panel ─────────────────────────────────────────────────────────

function StatsPanel({ lecture, onClose }: { lecture: Lecture; onClose: () => void }) {
  const { data: stats, isLoading } = useLectureStats(lecture.id);
  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className="fixed inset-0 z-[200] flex justify-end">
      <div className="flex-1 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-card border-l border-border flex flex-col h-full shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Lecture Stats</p>
            <h2 className="font-bold text-foreground mt-0.5">{lecture.title}</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : !stats ? (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No stats available yet. Publish the lecture first.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Total Watches", value: stats.totalWatches, icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { label: "Completion Rate", value: `${stats.completionRate}%`, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { label: "Avg Watch", value: `${stats.averageWatchPercent}%`, icon: PlayCircle, color: "text-violet-500", bg: "bg-violet-500/10" },
                  { label: "Confusion Spots", value: stats.confusionHotspots?.length ?? 0, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
                ].map(s => (
                  <div key={s.label} className="bg-secondary/50 rounded-2xl p-4">
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                      <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
                    </div>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              {stats.confusionHotspots?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Most Rewound Timestamps</h3>
                  <div className="space-y-2">
                    {stats.confusionHotspots.map((sec, i) => {
                      const m = Math.floor(sec / 60), s = sec % 60;
                      return (
                        <div key={i} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-2.5">
                          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-sm font-mono font-semibold text-foreground">{m}:{String(s).padStart(2, "0")}</span>
                          <span className="text-xs text-muted-foreground">students rewound here frequently</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Lecture Detail Panel ─────────────────────────────────────────────────────

function LectureDetailPanel({
  lecture,
  onClose,
  onReview,
  onRetranscribe,
  onRegenerateNotes,
  onRefreshVisuals,
  isGeneratingNotes,
  queuePosition,
  displayMode = "fullscreen",
}: {
  lecture: Lecture;
  onClose: () => void;
  onReview: () => void;
  onRetranscribe: () => void;
  onRegenerateNotes: () => void;
  onRefreshVisuals: () => Promise<void>;
  isGeneratingNotes?: boolean;
  queuePosition?: number;
  displayMode?: "fullscreen" | "dashboard";
}) {
  const hasNotesGen = useHasAiFeature("ai_content_generation");
  const hasQuizGen = useHasAiFeature("ai_content_generation") && useHasAiFeature("ai_study_assistant"); // maps to study assistant or content gen features
  const hasSpeechToText = useHasAiFeature("ai_speech_to_text");

  const availableTabs = useMemo(() => {
    const list: CourseTabId[] = [];
    if (hasNotesGen) list.push("notes");
    if (hasSpeechToText) list.push("transcript");
    if (hasQuizGen) list.push("quiz");
    list.push("overview"); // Stats tab is always visible
    return list;
  }, [hasNotesGen, hasSpeechToText, hasQuizGen]);

  const [tab, setTab] = useState<CourseTabId>(() => {
    if (hasNotesGen) return "notes";
    if (hasSpeechToText) return "transcript";
    if (hasQuizGen) return "quiz";
    return "overview";
  });

  // Keep selected tab valid if features are updated or changed
  useEffect(() => {
    if (!availableTabs.includes(tab)) {
      setTab(availableTabs[0] || "overview");
    }
  }, [availableTabs, tab]);

  const [quizSubTab, setQuizSubTab] = useState<"questions" | "students">("questions");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(true);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isRefreshingVisuals, setIsRefreshingVisuals] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleGenerateQuiz = async () => {
    const notes = lecture.aiNotesMarkdown || "";
    const transcript = lecture.transcript || "";
    if (!notes.trim() && !transcript.trim()) {
      toast({
        title: "No content to generate from",
        description: "A transcript or notes are required to generate quiz questions.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingQuiz(true);
    try {
      const courseLevel = lecture.batch?.name || lecture.topic?.name || "General";
      const result = await generateQuizForLecture({
        notes,
        transcript,
        lectureTitle: lecture.title,
        topicId: lecture.topic?.id,
        numQuestions: 5,
        courseLevel,
        language: lecture.lectureLanguage || "en",
      });
      const qs: QuizCheckpoint[] = (result as any).questions ?? [];
      await saveQuizCheckpoints(lecture.id, qs);
      queryClient.invalidateQueries({ queryKey: ["teacher", "lecture-checkpoints", lecture.id] });
      toast({ title: `${qs.length} quiz checkpoints generated!`, description: "Saved successfully." });
    } catch (err: any) {
      toast({ title: "Quiz generation failed", description: err?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const { data: stats, isLoading: statsLoading } = useLectureStats(lecture.id, { enabled: !!lecture.id && !lecture.isFallback });
  const { data: checkpoints = [] } = useQuery({
    queryKey: ["teacher", "lecture-checkpoints", lecture.id],
    queryFn: () => getQuizCheckpoints(lecture.id),
    enabled: !!lecture.id && !lecture.isFallback,
  });
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["teacher", "watch-analytics", lecture.id],
    queryFn: () => getWatchAnalytics(lecture.id),
    enabled: tab === "quiz" && !!lecture.id && !lecture.isFallback,
  });

  const isYouTube = isYouTubeUrl(lecture.videoUrl);

  const tabs = [
    { key: "notes" as const, label: "AI Notes", icon: BookOpen },
    { key: "transcript" as const, label: "Transcript", icon: FileText },
    { key: "quiz" as const, label: "Quiz", icon: ListChecks },
    { key: "overview" as const, label: "Stats", icon: BarChart3 },
  ];

  const noteImages = Array.isArray(lecture.aiNoteImages) ? lecture.aiNoteImages : [];
  const visualSections = Array.from(new Set(
    noteImages
      .map((image) => image.section_heading?.replace(/^#{1,6}\s*/, '').trim())
      .filter((heading): heading is string => Boolean(heading)),
  ));

  const handleRefreshVisuals = async () => {
    setIsRefreshingVisuals(true);
    try {
      await onRefreshVisuals();
    } finally {
      setIsRefreshingVisuals(false);
    }
  };

  const durationFormatted = lecture.videoDurationSeconds
    ? (lecture.videoDurationSeconds >= 60
      ? `${Math.round(lecture.videoDurationSeconds / 60)} mins`
      : `${Math.round(lecture.videoDurationSeconds)}s`)
    : "Duration pending";

  const isTranscribing = lecture.transcriptStatus === "processing" || lecture.transcriptStatus === "pending";
  const notesFailed = lecture.aiNotesMarkdown === "__NOTES_FAILED__";
  const notesGenerable = lecture.transcriptStatus === "done" && (!lecture.aiNotesMarkdown || notesFailed) && !isTranscribing && !isGeneratingNotes;
  const notesRegenerable = lecture.transcriptStatus === "done" && !!lecture.aiNotesMarkdown && !notesFailed && !isTranscribing && !isGeneratingNotes;
  const transcriptFailed = lecture.transcriptStatus === "failed" && !isGeneratingNotes;

  const { progressPct, elapsed, currentStep } = useAiProgress(lecture);
  const isHinglish = lecture.lectureLanguage === "hinglish" || lecture.lectureLanguage === "hi";
  const isOdia = lecture.lectureLanguage === "od";
  const AI_STEPS = isOdia ? AI_STEPS_ODIA : isHinglish ? AI_STEPS_HINGLISH : AI_STEPS_EN;
  const currentStepLabel = AI_STEPS[Math.min(currentStep, AI_STEPS.length - 1)]?.label ?? "Processing…";

  const { progressPct: notesPct, currentStep: notesStep } = useNotesGenerationProgress(isGeneratingNotes ?? false);

  const panel = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "overflow-y-auto bg-slate-50 flex flex-col font-poppins",
        displayMode === "dashboard"
          ? "fixed bottom-0 right-0 top-20 z-[45] left-0 lg:left-64 xl:left-72"
          : "fixed inset-0 z-[200]"
      )}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-blue-600 hover:text-white"
            aria-label="Back to lectures"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-blue-600">
              {lecture.batch?.name || "Recorded Class"}
            </p>
            <h1 className="truncate text-sm font-black leading-tight text-slate-900">{lecture.title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(lecture.status === "draft" || lecture.status === "published") && (
              <Button
                size="sm"
                onClick={() => { onClose(); onReview(); }}
                className="gap-1.5 h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white border-none font-bold"
              >
                <Edit3 className="w-3.5 h-3.5" /> {lecture.status === "published" ? "Edit Notes / Quiz" : "Review & Publish"}
              </Button>
            )}
            <button
              onClick={() => setDetailPanelOpen((open) => !open)}
              className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 lg:flex"
            >
              {detailPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              <span>{detailPanelOpen ? 'Hide Panel' : 'Show Panel'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main split content */}
      <div className="w-full px-4 py-5 sm:px-6 lg:px-8 flex-1 min-h-0">
        <div className={`grid gap-6 transition-all duration-300 h-full ${detailPanelOpen ? 'lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]' : 'grid-cols-1'}`}>
          {/* Left Column: Player & Metadata */}
          <main className="min-w-0 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm aspect-video">
              {lecture.videoUrl ? (
                isYouTube ? (
                  <iframe
                    src={lecture.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <SchoolVideoPlayer
                    src={lecture.videoUrl}
                    checkpoints={checkpoints}
                    autoPlay={false}
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-white/70">
                  Video unavailable
                </div>
              )}
            </div>
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {lecture.batch?.name && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
                        {lecture.batch.name}
                      </span>
                    )}
                    <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border shrink-0", statusColor[lecture.status] ?? "bg-secondary text-foreground border-border")}>
                      {lecture.status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
                      {statusLabel[lecture.status] ?? lecture.status}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-black text-slate-950">{lecture.title}</h2>
                  {lecture.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">{lecture.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <CalendarDays size={13} />
                  {fmtDate(lecture.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <Clock3 size={13} />
                  {durationFormatted}
                </span>
                {lecture.topic?.name && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 font-poppins">
                    <Tag size={13} />
                    {lecture.topic.name}
                  </span>
                )}
                {lecture.transcriptLanguage && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-600 uppercase">
                    {lecture.transcriptLanguage}
                  </span>
                )}
              </div>
            </section>
          </main>

          {/* Right Column: Tab Panel */}
          <aside className={`${detailPanelOpen ? 'block' : 'hidden'} min-w-0`}>
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col max-h-[85vh]">
              <CourseTabs
                activeTab={tab}
                onChange={setTab}
                availableTabs={availableTabs}
              />

              <div className="p-5 overflow-y-auto flex-1 font-poppins">
                {lecture.isFallback && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                    No matching coaching lecture was found in the database for this broadcast title/batch. AI features and student analytics are unavailable.
                  </div>
                )}
                {/* OVERVIEW (Stats) */}
                {tab === "overview" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                      <p className="text-xs font-bold text-blue-800">Video preview is shown in the main watch area.</p>
                      <p className="mt-1 text-[11px] font-semibold text-blue-600">Use this panel for teacher stats, content details, transcript, notes, and quiz checkpoints.</p>
                    </div>

                    {lecture.status === "published" && (
                      <div>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Watch stats</p>
                        {statsLoading ? (
                          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                        ) : stats ? (
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: "Total Watches", value: stats.totalWatches, icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
                              { label: "Completion Rate", value: `${stats.completionRate}%`, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                              { label: "Avg Watch", value: `${stats.averageWatchPercent}%`, icon: PlayCircle, color: "text-violet-500", bg: "bg-violet-500/10" },
                              { label: "Confusion Spots", value: stats.confusionHotspots?.length ?? 0, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
                            ].map(s => (
                              <div key={s.label} className="bg-secondary/50 rounded-xl p-3">
                                <p className="text-xl font-black text-slate-900">{s.value}</p>
                                <p className="text-xs font-medium text-slate-400">{s.label}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No watch stats yet.</p>
                        )}
                      </div>
                    )}
                    {stats?.confusionHotspots?.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Most Rewound Timestamps</p>
                        <div className="space-y-2">
                          {stats.confusionHotspots.map((sec, i) => {
                            const m = Math.floor(sec / 60), s = sec % 60;
                            return (
                              <div key={i} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-2.5">
                                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                                <span className="text-sm font-mono font-semibold text-foreground">{m}:{String(s).padStart(2, "0")}</span>
                                <span className="text-xs text-muted-foreground">students rewound here frequently</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* NOTES */}
                {tab === "notes" && (
                  <div className="space-y-4">
                    {/* Notes generation progress bar */}
                    {isGeneratingNotes && (
                      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-violet-600 font-bold flex items-center gap-1.5 animate-pulse">
                            <Brain className="w-3.5 h-3.5" />
                            {NOTES_GEN_STEPS[Math.min(notesStep, NOTES_GEN_STEPS.length - 1)]?.label ?? "Generating Notes…"}
                          </span>
                          <span className="text-xs font-extrabold text-violet-600">{notesPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-violet-200/50 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-600 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${notesPct}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Queue position */}
                    {!isGeneratingNotes && (queuePosition ?? 0) > 0 && (
                      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200/70 rounded-2xl p-4">
                        <Clock className="w-4 h-4 shrink-0" />
                        <div>
                          <p className="font-bold">Generation queued</p>
                          <p className="text-[10px] text-amber-600 mt-0.5">Position in queue: #{queuePosition}</p>
                        </div>
                      </div>
                    )}

                    {!isGeneratingNotes && queuePosition === -1 && (
                      <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200/70 rounded-2xl p-4">
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                        <div>
                          <p className="font-bold">Initializing notes generation…</p>
                        </div>
                      </div>
                    )}

                    {notesFailed && !isGeneratingNotes && (
                      <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs border border-red-200/60 flex items-center justify-between gap-3">
                        <p className="font-bold">Notes generation failed.</p>
                        <button
                          onClick={onRegenerateNotes}
                          className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 shrink-0"
                        >
                          <RefreshCw size={11} /> Retry
                        </button>
                      </div>
                    )}

                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <Sparkles size={13} /> AI-generated notes
                        </span>
                        {noteImages.length > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                            <ImagePlus size={10} /> {noteImages.length} visual{noteImages.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                            <ImagePlus size={10} /> No visuals
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-2">
                          {!!lecture.aiNotesMarkdown && queuePosition === 0 && (
                            <button
                              onClick={handleRefreshVisuals}
                              disabled={isRefreshingVisuals}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                            >
                              {isRefreshingVisuals ? <Loader2 size={11} className="animate-spin" /> : <ImagePlus size={11} />}
                              {noteImages.length > 0 ? 'Refresh visuals' : 'Add visuals'}
                            </button>
                          )}
                          {notesRegenerable && queuePosition === 0 && (
                            <button
                              onClick={onRegenerateNotes}
                              className="text-xs font-bold text-slate-400 hover:text-blue-600 hover:underline"
                            >
                              Regenerate notes
                            </button>
                          )}
                          {notesGenerable && queuePosition === 0 && (
                            <button
                              onClick={onRegenerateNotes}
                              className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline"
                            >
                              <Sparkles size={11} /> Generate notes
                            </button>
                          )}
                        </div>
                      </div>
                      {noteImages.length > 0 && (
                        <div className="mb-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-700">
                          <ImagePlus size={13} className="mt-0.5 shrink-0 text-blue-500" />
                          <span>
                            <span className="font-bold">{noteImages.length} educational image{noteImages.length !== 1 ? 's' : ''}</span>
                            {' '}embedded{visualSections.length > 0 ? ` at: ${visualSections.join(', ')}` : ''}
                          </span>
                        </div>
                      )}
                      {lecture.aiNotesMarkdown ? (
                        <MarkdownContent content={cleanAiMarkdown(embedStoredNoteImages(lecture.aiNotesMarkdown, noteImages))} />
                      ) : (
                        !isGeneratingNotes && !notesGenerable && (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                            <BookOpen className="w-10 h-10 opacity-20 mb-3" />
                            <p className="text-sm">No notes available yet.</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* TRANSCRIPT */}
                {tab === "transcript" && (
                  <div className="space-y-4">
                    {/* Speech to text progress bar */}
                    {isTranscribing && (
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-600 font-bold flex items-center gap-1.5 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5" />
                            {currentStepLabel}
                          </span>
                          <span className="text-xs font-extrabold text-blue-600">{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-blue-200/50 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${progressPct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-blue-500 font-mono">
                          <span>Elapsed: {fmtElapsed(elapsed)}</span>
                          <span>Est. ~5-9 min</span>
                        </div>
                      </div>
                    )}

                    {/* Retry button on fail */}
                    {transcriptFailed && queuePosition === 0 && (
                      <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs border border-red-200/60 flex items-center justify-between gap-3">
                        <p className="font-bold">Transcription failed.</p>
                        <button
                          onClick={onRetranscribe}
                          className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 shrink-0"
                        >
                          <RefreshCw size={11} /> Retry
                        </button>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-primary" /> Transcript
                        </p>
                        {lecture.transcriptStatus === "done" && !isTranscribing && queuePosition === 0 && (
                          <button
                            onClick={onRetranscribe}
                            className="text-xs font-bold text-slate-400 hover:text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <RefreshCw size={11} /> Regenerate transcript
                          </button>
                        )}
                      </div>
                      {lecture.transcript ? (
                        toTranscriptParagraphs(lecture.transcript).map((para, i) => (
                          <p key={i} className="text-sm text-foreground/80 leading-7 mb-3">{para}</p>
                        ))
                      ) : (
                        !isTranscribing && (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                            <FileText className="w-10 h-10 opacity-20 mb-3" />
                            <p className="text-sm mb-3">Transcript not available.</p>
                            <button
                              onClick={onRetranscribe}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                            >
                              <Sparkles size={13} /> Generate transcript
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* QUIZ */}
                {tab === "quiz" && (
                  <div className="space-y-4">
                    {checkpoints.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                        <ListChecks className="w-10 h-10 opacity-20 mb-3" />
                        <p className="text-sm font-bold text-slate-800 mb-1">No in-video quizzes yet</p>
                        <p className="text-xs text-slate-500 mb-4 max-w-xs">Generate interactive quiz checkpoints from lecture notes or transcript for students.</p>
                        <Button
                          onClick={handleGenerateQuiz}
                          disabled={isGeneratingQuiz || (!lecture.transcript && !lecture.aiNotesMarkdown)}
                          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl border-none shadow-sm"
                        >
                          {isGeneratingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          {isGeneratingQuiz ? "Generating Quiz…" : "Generate in-video quiz"}
                        </Button>
                      </div>
                    )}
                    {checkpoints.length > 0 && (
                      <>
                        {analytics && (
                          <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-xl mb-2">
                            <div className="text-center">
                              <p className="text-lg font-bold text-foreground">{analytics.students.filter(s => s.answeredCount > 0).length}</p>
                              <p className="text-[10px] text-muted-foreground">Attempted By</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-foreground">
                                {(() => {
                                  const s = analytics.questionStats.filter(q => q.accuracy !== null);
                                  return s.length ? Math.round(s.reduce((a, q) => a + (q.accuracy ?? 0), 0) / s.length) + "%" : "—";
                                })()}
                              </p>
                              <p className="text-[10px] text-muted-foreground">Avg Accuracy</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between border-b border-slate-100 shrink-0 mb-3">
                          <div className="flex flex-1">
                            {(["questions", "students"] as const).map(k => (
                              <button key={k} onClick={() => setQuizSubTab(k)}
                                className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all capitalize ${quizSubTab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                                  }`}>
                                {k}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={handleGenerateQuiz}
                            disabled={isGeneratingQuiz}
                            className="text-xs font-bold text-slate-400 hover:text-blue-600 hover:underline flex items-center gap-1 ml-3 shrink-0 pb-1"
                          >
                            <Sparkles size={11} /> {isGeneratingQuiz ? "Generating…" : "Regenerate quiz"}
                          </button>
                        </div>

                        <div className="space-y-3">
                          {quizSubTab === "questions" && checkpoints.map((cp, i) => {
                            const qStat = analytics?.questionStats.find(q => q.questionId === cp.id);
                            const isExpanded = expandedQuestion === cp.id;
                            const optionCounts: Record<string, number> = {};
                            if (analytics) {
                              cp.options.forEach(o => { optionCounts[o.label] = 0; });
                              analytics.students.forEach(s => {
                                const r = s.responses.find(r => r.questionId === cp.id);
                                if (r) optionCounts[r.selectedOption] = (optionCounts[r.selectedOption] ?? 0) + 1;
                              });
                            }
                            const totalAnswered = qStat?.totalAttempts ?? 0;

                            return (
                              <div key={cp.id} className="border border-border rounded-xl overflow-hidden bg-background">
                                <button
                                  type="button"
                                  onClick={() => setExpandedQuestion(isExpanded ? null : cp.id)}
                                  className="w-full flex items-start gap-3 p-3 text-left hover:bg-secondary/35 transition-colors"
                                >
                                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">Q{i + 1}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground mb-1">at {cp.triggerAtPercent}% · {cp.segmentTitle}</p>
                                    <MarkdownRenderer content={cp.questionText} className="prose-p:my-0 text-xs font-medium text-foreground leading-normal" />
                                  </div>
                                  <ChevronRight size={14} className={cn("text-muted-foreground shrink-0 mt-0.5 transition-transform", isExpanded && "rotate-90")} />
                                </button>

                                {isExpanded && (
                                  <div className="border-t border-border p-3 space-y-2 bg-secondary/15">
                                    {cp.options.map(opt => {
                                      const count = optionCounts[opt.label] ?? 0;
                                      const pct = totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0;
                                      const isCorrect = opt.label === cp.correctOption;
                                      return (
                                        <div key={opt.label} className={cn("rounded-xl p-2.5 text-xs border", isCorrect ? "bg-emerald-500/8 border-emerald-500/25" : "bg-background border-border/60")}>
                                          <div className="flex items-center gap-2">
                                            <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                              isCorrect ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500")}>{opt.label}</span>
                                            <span className="min-w-0 flex-1 truncate">
                                              <MarkdownRenderer content={opt.text} className="prose-p:my-0 text-xs" />
                                            </span>
                                            {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                            {analytics && <span className="text-[10px] font-bold text-slate-500 shrink-0">{count} ({pct}%)</span>}
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {cp.explanation && (
                                      <div className="text-[11px] text-muted-foreground bg-white border border-border/55 rounded-lg px-2.5 py-1.5 leading-normal">
                                        <span className="mr-1">Idea:</span>
                                        <MarkdownRenderer content={cp.explanation} className="inline prose-p:my-0 text-[11px] text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {quizSubTab === "students" && (
                            analytics?.students.length === 0 ? (
                              <p className="text-center py-6 text-xs text-muted-foreground">No students attempted yet.</p>
                            ) : (
                              (analytics?.students ?? [])
                                .filter(s => s.answeredCount > 0)
                                .map(s => (
                                  <div key={s.studentId} className="flex items-center gap-3 border border-border/80 rounded-xl p-3 bg-background">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                      {s.studentName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-foreground truncate">{s.studentName}</p>
                                      <p className="text-[10px] text-muted-foreground">Accuracy: {s.quizScore !== null ? Math.round(s.quizScore) + "%" : "N/A"}</p>
                                    </div>
                                    <div className="shrink-0 text-xs font-mono font-medium text-muted-foreground">
                                      {s.correctCount}/{s.answeredCount} ans
                                    </div>
                                  </div>
                                ))
                            )
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </motion.div>
  );

  return createPortal(panel, document.body);
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

type UploadStep = 1 | 2 | 3;
type VideoSource = "upload" | "youtube";

function UploadModal({ onClose, onSuccess, batches }: {
  onClose: () => void;
  onSuccess: (lectureId: string, videoUrl: string, topicId: string) => void;
  batches: any[];
}) {
  const createLecture = useCreateLecture();
  const { toast } = useToast();
  const sttEnabled = useHasAiFeature("ai_speech_to_text");
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<UploadStep>(1);
  const [batchId, setBatchId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lectureLanguage, setLectureLanguage] = useState<"en" | "hi" | "hinglish" | "od">("en");
  const [videoSource, setVideoSource] = useState<VideoSource>("upload");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null); // actual File for upload
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempLectureId] = useState(() => uuidv4());

  const { user } = useAuthStore();
  // BatchSubjectTeacher.teacherId is a FK to User entity, so compare against user.id
  const teacherId = user?.id ?? "";

  useEffect(() => {
    return () => {
      if (videoPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  const handleVideoFileSelect = (file: File | null) => {
    setVideoFile(file);
    setVideoUrl("");
    setUploadProgress(0);
    setVideoPreviewUrl((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : "";
    });
  };

  // Reset subject/chapter/topic when batch changes
  const handleBatchChange = (id: string) => {
    setBatchId(id);
    setSelectedSubjectId("");
    setSelectedChapterId("");
    setTopicId("");
  };

  const { data: allSubjects, isLoading: subjectsLoading } = useSubjects(batchId || undefined);
  const { data: chapters } = useChapters(selectedSubjectId);
  const { data: topics } = useTopics(selectedChapterId);

  // Fetch subject-teacher assignments for the selected batch
  const { data: batchAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["batch-subject-teachers", batchId],
    queryFn: () => getBatchSubjectTeachers(batchId),
    enabled: !!batchId,
  });

  // Check if this teacher is the primary teacher of the selected batch
  const isPrimaryTeacher = !!batchId && batches.find((b: any) => b.id === batchId)?.teacherId === teacherId;

  // Names of subjects assigned to the current teacher in this batch (trimmed + lowercased)
  const assignedSubjectNames = batchAssignments
    .filter(a => a.teacherId === teacherId)
    .map(a => a.subjectName.toLowerCase().trim());

  // Subject list logic:
  // - Still loading → show nothing (avoid flash of wrong state)
  // - Primary teacher with NO explicit subject assignments → show all subjects
  // - Teacher has explicit subject assignments → show only those matching subjects
  // - No assignments configured in this batch at all → show all subjects
  const hasAnyAssignments = batchAssignments.length > 0;
  const isLoading = subjectsLoading || (!!batchId && assignmentsLoading);
  const subjects = isLoading
    ? []
    : !hasAnyAssignments || (isPrimaryTeacher && assignedSubjectNames.length === 0)
      ? (allSubjects ?? [])
      : (allSubjects ?? []).filter(
        (s: any) => assignedSubjectNames.includes(s.name.toLowerCase().trim())
      );

  const handleThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = ev => setThumbnailPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadToS3 = async (endpoint: string, file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post(endpoint, form, {
      timeout: 10 * 60 * 1000,
      transformRequest: [(_data, headers) => { delete headers['Content-Type']; return form; }],
      onUploadProgress: e => { if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); },
    });
    const url: string = res.data?.data?.url ?? res.data?.url;
    return url.startsWith("http") ? url : `${import.meta.env.VITE_BACKEND_URL || getApiOrigin() || "http://127.0.0.1:3000"}${url}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const trimmedUrl = videoUrl.trim();

      if (videoSource === "youtube") {
        if (!isYouTubeUrl(trimmedUrl)) {
          toast({ title: "Not a YouTube URL", description: "Paste a youtube.com or youtu.be link.", variant: "destructive" });
          return;
        }
        if (!isValidYouTubeLectureUrl(trimmedUrl)) {
          toast({
            title: "Invalid YouTube link",
            description: "Use a watch, Shorts, embed, or youtu.be URL with a valid video id.",
            variant: "destructive",
          });
          return;
        }
      }

      let finalVideoUrl = trimmedUrl;
      let finalThumbnailUrl: string | undefined;

      if (videoSource === "upload" && videoFile) {
        finalVideoUrl = await uploadToS3("/content/lectures/upload-video", videoFile, setUploadProgress);
      }

      if (thumbnailFile) {
        finalThumbnailUrl = await uploadToS3("/content/lectures/upload-thumbnail", thumbnailFile);
      }

      const lecture = await createLecture.mutateAsync({
        batchId,
        title,
        description: description || undefined,
        type: "recorded",
        topicId: topicId || undefined,
        lectureLanguage,
        videoUrl: finalVideoUrl || undefined,
        thumbnailUrl: finalThumbnailUrl,
      });
      if (finalVideoUrl) {
        toast({ title: "Lecture uploaded!", description: "AI is analysing your lecture in the background." });
        // Kick off background AI processing — non-blocking
        onSuccess(lecture.id, lecture.videoUrl ?? finalVideoUrl, topicId);
      } else {
        toast({ title: "Lecture created!", description: "No video attached. AI processing skipped." });
      }
      onClose();
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || err?.message || "Upload failed", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground">Upload Recorded Lecture</h2>
            <div className="flex items-center gap-1.5 mt-1">
              {([1, 2, 3] as UploadStep[]).map(s => (
                <div key={s} className={cn("h-1 rounded-full transition-all", s <= step ? "bg-primary w-8" : "bg-muted w-4")} />
              ))}
              <span className="text-xs text-muted-foreground ml-1">Step {step} of 3</span>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">

          {/* Step 1: Batch + Topic + Title */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Batch *</Label>
                <select value={batchId} onChange={e => handleBatchChange(e.target.value)} required
                  className="h-11 w-full px-4 bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-xl text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20">
                  <option value="">Select batch…</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <select
                  value={selectedSubjectId}
                  onChange={e => { setSelectedSubjectId(e.target.value); setSelectedChapterId(""); setTopicId(""); }}
                  disabled={!batchId}
                  className="h-11 w-full px-4 bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-xl text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-40"
                >
                  <option value="">
                    {!batchId
                      ? "Select batch first…"
                      : isLoading
                        ? "Loading subjects…"
                        : subjects.length === 0
                          ? "No subjects found"
                          : "Select subject…"}
                  </option>
                  {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {batchId && !isLoading && hasAnyAssignments && assignedSubjectNames.length === 0 && !isPrimaryTeacher && subjects.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">
                    No subjects are assigned to you for this batch yet. Contact your admin.
                  </p>
                )}
              </div>
              {selectedSubjectId && (
                <div className="space-y-1.5">
                  <Label>Chapter</Label>
                  <select value={selectedChapterId} onChange={e => { setSelectedChapterId(e.target.value); setTopicId(""); }}
                    className="h-11 w-full px-4 bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-xl text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20">
                    <option value="">Select chapter…</option>
                    {(chapters ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {selectedChapterId && (
                <div className="space-y-1.5">
                  <Label>Topic</Label>
                  <select value={topicId} onChange={e => setTopicId(e.target.value)}
                    className="h-11 w-full px-4 bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-xl text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20">
                    <option value="">Select topic…</option>
                    {(topics ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Lecture Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Newton's Laws of Motion — Part 1" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description for students…" rows={2} className="resize-none" />
              </div>
              <div className="space-y-1.5">
                  <Label>Lecture Language <span className="text-muted-foreground font-normal">(saved with lecture)</span></Label>
                  <div className="flex gap-2">
                    {([
                      { value: "en" as const, label: "English", sub: "Default" },
                      { value: "hi" as const, label: "Hindi", sub: "Hindi / Hinglish" },
                      { value: "od" as const, label: "Odia", sub: "Odia / Sarvam" },
                    ] as const).map(opt => (
                      <button key={opt.value} type="button" onClick={() => setLectureLanguage(opt.value)}
                        className={cn(
                          "flex-1 flex flex-col items-center py-3 rounded-xl border text-sm font-medium transition-colors",
                          lectureLanguage === opt.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-slate-50 text-muted-foreground hover:border-primary/40",
                        )}>
                        <span className="text-base font-bold">{opt.label}</span>
                        <span className="text-[10px] mt-0.5">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {sttEnabled
                      ? (lectureLanguage === "od"
                        ? "Odia audio is transcribed by Sarvam AI and Gemini generates the notes in Odia."
                        : "Hindi handles both pure Hindi and Hinglish lectures; transcript is auto-translated to English for AI notes.")
                      : "Stored with the lecture and used when AI speech-to-text is enabled."}
                  </p>
                </div>
            </div>
          )}

          {/* Step 2: Video Source + Thumbnail */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "upload" as VideoSource, label: "Upload Video", icon: Upload },
                  { value: "youtube" as VideoSource, label: "YouTube URL", icon: Youtube },
                ] as { value: VideoSource; label: string; icon: any }[]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setVideoSource(opt.value);
                      if (opt.value === "youtube") {
                        handleVideoFileSelect(null);
                        if (!isYouTubeUrl(videoUrl)) setVideoUrl("");
                      } else if (isYouTubeUrl(videoUrl)) {
                        setVideoUrl("");
                      }
                    }}
                    className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors",
                      videoSource === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50")}>
                    <opt.icon className={cn("w-6 h-6", videoSource === opt.value ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-sm font-medium", videoSource === opt.value ? "text-primary" : "text-muted-foreground")}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-amber-800">
                  {videoSource === "youtube"
                    ? (sttEnabled
                      ? `${YOUTUBE_LECTURE_CAPTIONS_HINT} For playback-only links, add the video under topic resources instead.`
                      : "Paste a YouTube link for students to watch. For playback-only links, add the video under topic resources instead.")
                    : (sttEnabled
                      ? "Uploaded videos are transcribed with speech-to-text. Choose English or Hindi before continuing."
                      : "Upload a video for students to watch.")}
                </p>
              </div>

              {videoSource === "upload" ? (
                <div className="space-y-4">
                  <LectureVideoUpload
                    courseId={batchId}
                    lectureId={tempLectureId}
                    currentUrl={videoPreviewUrl || videoUrl}
                    onUpload={(url) => setVideoUrl(url)}
                    onFileSelect={handleVideoFileSelect}
                    onRemove={() => handleVideoFileSelect(null)}
                    deferUpload
                  />
                  {(videoFile || videoUrl) && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-emerald-700">
                          {videoFile ? "Video selected for this lecture" : "Video successfully uploaded"}
                        </p>
                        <p className="text-xs text-emerald-600 truncate">{videoFile?.name || videoUrl}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Label>YouTube Video URL *</Label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="pl-9" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Students watch on YouTube; AI uses captions for notes and quizzes.</p>
                </div>
              )}

              {/* Thumbnail */}
              <div className="space-y-1.5">
                <Label>Thumbnail (optional)</Label>
                <div className="flex gap-3 items-center">
                  <div className={cn("w-24 h-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer",
                    thumbnailPreview ? "border-transparent" : "border-border hover:border-primary/50")}
                    onClick={() => thumbRef.current?.click()}>
                    {thumbnailPreview
                      ? <img src={thumbnailPreview} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Add a thumbnail to make the lecture stand out.</p>
                    <button className="text-xs text-primary font-medium mt-1" onClick={() => thumbRef.current?.click()}>
                      {thumbnailPreview ? "Change image" : "Upload image"}
                    </button>
                    <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-2 text-sm">
                <p className="font-semibold text-foreground">Ready to upload</p>
                <div className="space-y-1 text-muted-foreground">
                  <p><span className="text-foreground font-medium">Title:</span> {title}</p>
                  <p><span className="text-foreground font-medium">Batch:</span> {batches.find(b => b.id === batchId)?.name}</p>
                  <p>
                    <span className="text-foreground font-medium">Language:</span>{" "}
                    {lectureLanguage === "od" ? "Odia (ଓଡ଼ିଆ)" : lectureLanguage === "hi" ? "Hindi / Hinglish" : "English"}
                  </p>
                  <p><span className="text-foreground font-medium">Source:</span> {videoSource === "youtube" ? "YouTube" : "File upload"}</p>
                  {videoSource === "youtube" ? (
                    <p className="break-all"><span className="text-foreground font-medium">URL:</span> {videoUrl.trim()}</p>
                  ) : (
                    <>
                      <p><span className="text-foreground font-medium">File:</span> {videoFile?.name ?? "Uploaded file"}</p>
                      {videoFile && <p><span className="text-foreground font-medium">Size:</span> {(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>}
                    </>
                  )}
                </div>
              </div>

              {/* Upload progress bar — shown only while submitting a file upload */}
              {isSubmitting && videoSource === "upload" && videoFile && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {uploadProgress < 100 ? `Uploading video… ${uploadProgress}%` : "Processing…"}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }} />
                  </div>
                  {uploadProgress === 100 && (
                    <p className="text-xs text-muted-foreground">
                      Upload complete — creating lecture &amp; starting AI processing…
                    </p>
                  )}
                </div>
              )}

              {/* AI pipeline steps */}
              <div className="rounded-xl border border-border p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> What happens after upload
                </p>
                {(lectureLanguage === "od"
                  ? [
                    { icon: Mic, text: "Transcribes Odia audio with Sarvam AI" },
                    { icon: Brain, text: "Generates structured Odia notes with Gemini" },
                    { icon: ImagePlus, text: "Prefers diagrams with Odia labels, then falls back to English labels" },
                    { icon: ListChecks, text: "Extracts key concepts and important points" },
                    { icon: Eye, text: "You review and optionally edit the AI notes" },
                    { icon: Send, text: "You publish and students are notified" },
                  ]
                  : lectureLanguage === "hi"
                    ? [
                      { icon: Mic, text: "Transcribes Hindi / Hinglish audio" },
                      { icon: Brain, text: "Translates transcript to English via Sarvam AI" },
                      { icon: FileText, text: "Generates structured English lecture notes" },
                      { icon: ListChecks, text: "Extracts key formulas, concepts & important points" },
                      { icon: Eye, text: "You review & optionally edit the AI notes" },
                      { icon: Send, text: "You publish — students get notified instantly" },
                    ]
                    : [
                      { icon: Mic, text: "AI transcribes the full audio (Speech-to-Text)" },
                      { icon: FileText, text: "Generates structured lecture notes" },
                      { icon: ListChecks, text: "Extracts key formulas, concepts & important points" },
                      { icon: Eye, text: "You review & optionally edit the AI notes" },
                      { icon: Send, text: "You publish — students get notified instantly" },
                    ]
                ).map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <s.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          <Button variant="ghost" onClick={step === 1 ? onClose : () => setStep(s => (s - 1) as UploadStep)}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(s => (s + 1) as UploadStep)}
              disabled={(step === 1 && (!batchId || !title)) || (step === 2 && !videoUrl.trim() && !videoFile)}
              className="gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 min-w-[160px]">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isSubmitting && videoSource === "upload" && videoFile && uploadProgress < 100
                ? `Uploading ${uploadProgress}%`
                : isSubmitting ? "Processing…" : videoSource === "youtube" ? "Save & process" : "Upload & Process"}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Schedule Live Modal ──────────────────────────────────────────────────────

function ScheduleLiveModal({ onClose, batches }: { onClose: (obs?: BroadcastCreated | null) => void; batches: any[] }) {
  const createLecture = useCreateLecture();
  const { toast } = useToast();
  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuthStore();
  const teacherId = user?.id ?? "";

  const handleBatchChange = (id: string) => {
    setBatchId(id);
    setSubjectId("");
    setChapterId("");
    setTopicId("");
  };

  const { data: allSubjects, isLoading: subjectsLoading } = useSubjects(batchId || undefined);
  const { data: chapters } = useChapters(subjectId);
  const { data: topics } = useTopics(chapterId);

  const { data: batchAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["batch-subject-teachers", batchId],
    queryFn: () => getBatchSubjectTeachers(batchId),
    enabled: !!batchId,
  });

  const isPrimaryTeacher = !!batchId && batches.find((b: any) => b.id === batchId)?.teacherId === teacherId;
  const assignedSubjectNames = batchAssignments
    .filter((a: any) => a.teacherId === teacherId)
    .map((a: any) => a.subjectName.toLowerCase().trim());
  const hasAnyAssignments = batchAssignments.length > 0;
  const subjectsReady = !subjectsLoading && !(!!batchId && assignmentsLoading);
  const subjectList: any[] = !subjectsReady
    ? []
    : !hasAnyAssignments || (isPrimaryTeacher && assignedSubjectNames.length === 0)
      ? (allSubjects ?? [])
      : (allSubjects ?? []).filter(
        (s: any) => assignedSubjectNames.includes(s.name.toLowerCase().trim())
      );

  const chapterList: any[] = Array.isArray(chapters) ? chapters : [];
  const topicList: any[] = Array.isArray(topics) ? topics : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) { toast({ title: "Please select a topic", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      // Create the content lecture (for student notifications + calendar)
      await createLecture.mutateAsync({
        batchId, title, description: description || undefined,
        type: "live",
        topicId,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      // Create the OBS broadcast lecture (generates RTMP stream key)
      let obsResult: BroadcastCreated | null = null;
      try {
        obsResult = await liveBroadcast.create({
          title,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          batchId: batchId || undefined,
          subjectId: subjectId || undefined,
          batchName: batches.find(b => b.id === batchId)?.name,
          subjectName: subjectList.find((s: any) => s.id === subjectId)?.name,
          description: description || undefined,
        });
      } catch {
        // Non-fatal — broadcast might not be configured; just skip
      }
      toast({ title: "Live class scheduled!", description: "Students have been notified and it's saved in their calendar." });
      onClose(obsResult);
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || "Scheduling failed", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col"
        style={{ maxHeight: "min(90vh, 750px)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base">Schedule Live Class</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Students will be notified and reminded automatically</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — simple single column */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Batch *</Label>
              <CustomSelect
                value={batchId}
                onChange={handleBatchChange}
                options={[
                  { value: "", label: "Select batch…" },
                  ...batches.map((b) => ({ value: b.id, label: b.name })),
                ]}
                className="w-full"
              />
            </div>

            {/* Subject & Chapter side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <CustomSelect
                  value={subjectId}
                  onChange={(id) => { setSubjectId(id); setChapterId(""); setTopicId(""); }}
                  options={[
                    { value: "", label: !batchId ? "Select batch first…" : !subjectsReady ? "Loading…" : subjectList.length === 0 ? "No subjects found" : "Select subject…" },
                    ...subjectList.map((s: any) => ({ value: s.id, label: s.name })),
                  ]}
                  disabled={!batchId}
                  className="w-full"
                />
                {batchId && subjectsReady && hasAnyAssignments && assignedSubjectNames.length === 0 && !isPrimaryTeacher && subjectList.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">No subjects assigned to you for this batch. Contact your admin.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Chapter *</Label>
                <CustomSelect
                  value={chapterId}
                  onChange={(id) => { setChapterId(id); setTopicId(""); }}
                  options={[
                    { value: "", label: !subjectId ? "Select subject first…" : "Select chapter…" },
                    ...chapterList.map((c: any) => ({ value: c.id, label: c.name })),
                  ]}
                  disabled={!subjectId}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Topic *</Label>
              <CustomSelect
                value={topicId}
                onChange={setTopicId}
                options={[
                  { value: "", label: !chapterId ? "Select chapter first…" : "Select topic…" },
                  ...topicList.map((t: any) => ({ value: t.id, label: t.name })),
                ]}
                disabled={!chapterId}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Class Title *</Label>
              <Input required value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Electrostatics — Doubt Session" className="h-11" />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="What topics will be covered? Any prerequisites?" rows={3} className="resize-none" />
            </div>

            <div className="space-y-1.5">
              <Label>Date & Time *</Label>
              <Input required type="datetime-local" value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)} className="h-11" />
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 px-5 sm:px-7 py-4 border-t border-border bg-card">
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !batchId || !topicId || !title || !scheduledAt} className="gap-2 px-5">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Schedule Live Class
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/** Inline edit for lecture title on list cards (recorded + live). */
function LectureTitleWithEdit({ lecture, compact }: { lecture: Lecture; compact?: boolean }) {
  const updateLecture = useUpdateLecture();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(lecture.title);

  useEffect(() => {
    if (!editing) setDraft(lecture.title);
  }, [lecture.title, editing]);

  const cancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDraft(lecture.title);
    setEditing(false);
  };

  const save = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const t = draft.trim();
    if (!t) {
      toast({ title: "Title required", description: "Please enter a lecture name.", variant: "destructive" });
      return;
    }
    if (t === lecture.title) {
      setEditing(false);
      return;
    }
    try {
      await updateLecture.mutateAsync({ id: lecture.id, title: t });
      toast({ title: "Lecture name updated" });
      setEditing(false);
    } catch {
      toast({ title: "Could not update name", variant: "destructive" });
    }
  };

  if (editing) {
    return (
      <div
        className="flex items-center gap-1.5 min-w-0 w-full"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="h-8 text-sm min-w-0 flex-1"
          maxLength={200}
          autoFocus
          onClick={e => e.stopPropagation()}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              void save();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
        />
        <Button type="button" size="sm" className="h-8 shrink-0 px-2" onClick={e => void save(e)} disabled={updateLecture.isPending}>
          {updateLecture.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 shrink-0 px-2" onClick={cancel} disabled={updateLecture.isPending}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 min-w-0", compact && "max-w-full")}>
      <h3
        className={cn(
          "font-semibold text-foreground text-sm min-w-0 flex-1",
          compact && "truncate group-hover:text-primary transition-colors",
        )}
      >
        {lecture.title}
      </h3>
      <button
        type="button"
        className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
        onClick={e => {
          e.stopPropagation();
          setEditing(true);
        }}
        aria-label="Edit lecture name"
        title="Edit name"
      >
        <Edit3 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Recorded Lecture Card ────────────────────────────────────────────────────

const transcriptStatusBadge: Record<string, { cls: string; label: string }> = {
  pending: { cls: "bg-slate-500/10 text-slate-500 border-slate-500/20", label: "Transcript Pending" },
  processing: { cls: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Transcribing…" },
  done: { cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Transcript Ready" },
  failed: { cls: "bg-red-500/10 text-red-600 border-red-500/20", label: "Transcript Failed" },
};

function RecordedCard({ lecture, onView, onReview, onStats, onDelete, onRetranscribe, onRegenerateNotes, processingStep, isGeneratingNotes, queuePosition, onAssignments }: {
  lecture: Lecture;
  onView: () => void;
  onReview: () => void;
  onStats: () => void;
  onDelete: () => void;
  onRetranscribe: () => void;
  onRegenerateNotes: () => void;
  onAssignments?: () => void;
  processingStep?: number;
  isGeneratingNotes?: boolean;
  /** 0 = not queued, -1 = currently active, 1+ = queue position */
  queuePosition?: number;
}) {
  const tsBadge = lecture.transcriptStatus ? transcriptStatusBadge[lecture.transcriptStatus] : null;
  const isYouTube = /youtube\.com|youtu\.be/i.test(lecture.videoUrl ?? "");
  const ytThumb = isYouTube ? getYouTubeThumbnail(lecture.videoUrl) : null;
  // Suppress "failed" UI when notes are actively generating — transcript clearly exists
  const notesFailed = lecture.aiNotesMarkdown === "__NOTES_FAILED__";
  const transcriptFailed = lecture.transcriptStatus === "failed" && !isGeneratingNotes;
  const isTranscribing = lecture.transcriptStatus === "processing" || lecture.transcriptStatus === "pending";
  const notesGenerable = lecture.transcriptStatus === "done" && (!lecture.aiNotesMarkdown || notesFailed) && !isTranscribing && !isGeneratingNotes;
  const notesRegenerable = lecture.transcriptStatus === "done" && !!lecture.aiNotesMarkdown && !notesFailed && !isTranscribing && !isGeneratingNotes;

  const { progressPct, elapsed, currentStep } = useAiProgress(lecture, processingStep);
  const isHinglish = lecture.lectureLanguage === "hinglish" || lecture.lectureLanguage === "hi";
  const isOdia = lecture.lectureLanguage === "od";
  const AI_STEPS = isOdia ? AI_STEPS_ODIA : isHinglish ? AI_STEPS_HINGLISH : AI_STEPS_EN;
  const currentStepLabel = AI_STEPS[Math.min(currentStep, AI_STEPS.length - 1)]?.label ?? "Processing…";

  const { progressPct: notesPct, currentStep: notesStep } = useNotesGenerationProgress(isGeneratingNotes ?? false);

  const [panel, setPanel] = useState<null | "notes" | "transcript">(null);
  const [panelText, setPanelText] = useState("");
  const [saving, setSaving] = useState(false);
  const updateLecture = useUpdateLecture();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const openPanel = (type: "notes" | "transcript") => {
    if (panel === type) { setPanel(null); return; }
    setPanel(type);
    setPanelText("");
  };

  const savePanel = async () => {
    if (!panelText.trim() || !panel) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = { transcriptStatus: "done" };
      if (panel === "notes") payload.aiNotesMarkdown = panelText.trim();
      else payload.transcript = panelText.trim();
      await updateLecture.mutateAsync({ id: lecture.id, ...payload as any });
      queryClient.invalidateQueries({ queryKey: ["lectures"] });
      toast({ title: panel === "notes" ? "Notes saved" : "Transcript saved", description: "Saved successfully." });
      setPanel(null);
      setPanelText("");
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Thumbnail */}
        <div
          onClick={onView}
          className="group/thumb relative w-full aspect-video sm:w-28 sm:h-16 sm:aspect-none shrink-0 overflow-hidden rounded-xl bg-slate-900 cursor-pointer"
        >
          {lecture.thumbnailUrl ? (
            <img src={lecture.thumbnailUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105" loading="lazy" />
          ) : isYouTube && ytThumb ? (
            <img src={ytThumb} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105" loading="lazy" />
          ) : lecture.videoUrl ? (
            <video
              src={lecture.videoUrl}
              preload="metadata"
              muted
              playsInline
              className="w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover/thumb:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
              <PlayCircle className="w-6 h-6 text-white/60" />
            </div>
          )}
          {/* Play icon overlay on hover */}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover/thumb:bg-black/30 group-hover/thumb:opacity-100">
            <PlayCircle className="w-6 h-6 text-white drop-shadow-lg" />
          </span>
          {/* Duration badge */}
          {lecture.videoDurationSeconds && (
            <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
              {lecture.videoDurationSeconds >= 60
                ? `${Math.round(lecture.videoDurationSeconds / 60)} min`
                : `${Math.round(lecture.videoDurationSeconds)}s`}
            </span>
          )}
        </div>

        {/* Info & Badges */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
            <div className="min-w-0 flex-1">
              <div className="group">
                <LectureTitleWithEdit lecture={lecture} compact />
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-500 break-words leading-normal">
                · {[lecture.topic?.name, lecture.batch?.name].filter(Boolean)[0] || 'Lecture'} · {fmtDate(lecture.createdAt)}
              </p>
              <button
                onClick={onView}
                className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline whitespace-normal text-left"
              >
                <ChevronRight className="w-3.5 h-3.5 shrink-0" /> Click to view details
              </button>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end flex-wrap gap-1.5 shrink-0">
              <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-black uppercase border", statusColor[lecture.status] ?? "bg-secondary text-foreground border-border")}>
                {lecture.status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
                {statusLabel[lecture.status] ?? lecture.status}
              </span>
              {(isTranscribing || isGeneratingNotes) && (
                <span className="text-[10px] text-muted-foreground font-medium">Est. ~5-9 min</span>
              )}
              {isGeneratingNotes && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-violet-500/10 text-violet-600 border-violet-500/20">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  {notesPct}%
                </span>
              )}
              {tsBadge && lecture.status !== "processing" && !isGeneratingNotes && (
                <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border", tsBadge.cls)}>
                  {isTranscribing && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                  {lecture.transcriptStatus === "done" && <Mic className="w-2.5 h-2.5" />}
                  {isTranscribing ? `${progressPct}%` : tsBadge.label}
                </span>
              )}
              {isTranscribing && (
                <span className="text-[10px] font-mono text-blue-500/70">{fmtElapsed(elapsed)}</span>
              )}
            </div>
          </div>

          {/* Compact progress bar — always visible while AI is working */}
          {isTranscribing && (
            <div className="mt-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-blue-500 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  {currentStepLabel}
                </span>
                <span className="text-[11px] font-semibold text-blue-600">{progressPct}% complete</span>
              </div>
              <div className="w-full h-1.5 bg-blue-500/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Notes generation progress bar — violet, shown when teacher clicks "Generate Notes" */}
          {isGeneratingNotes && (
            <div className="mt-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-violet-600 font-medium flex items-center gap-1">
                  <Brain className="w-3 h-3 animate-pulse" />
                  {NOTES_GEN_STEPS[Math.min(notesStep, NOTES_GEN_STEPS.length - 1)].label}
                </span>
                <span className="text-[11px] font-semibold text-violet-600">{notesPct}% complete</span>
              </div>
              <div className="w-full h-1.5 bg-violet-500/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${notesPct}%` }}
                />
              </div>
            </div>
          )}

          {(processingStep !== undefined || lecture.status === "processing") && lecture.status !== "draft" && lecture.status !== "published" && (
            <div className="mt-3">
              <AiProcessingCard lecture={lecture} activeStep={processingStep} />
            </div>
          )}

          {notesFailed && !isGeneratingNotes && (
            <div className="mt-3 bg-amber-500/10 text-amber-700 px-3 py-2 rounded-lg text-[11px] border border-amber-500/20 font-medium">
              Notes generation failed or timed out. Click "Generate Notes" below to retry.
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {lecture.status === "draft" && (
            <Button size="sm" onClick={e => { e.stopPropagation(); onReview(); }} className="gap-1.5 h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white border-none">
              <Edit3 className="w-3.5 h-3.5" /> Review AI Notes
            </Button>
          )}
          {lecture.status === "published" && (
            <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); onStats(); }} className="gap-1.5 h-8 text-xs">
              <BarChart3 className="w-3.5 h-3.5" /> Live Stats
            </Button>
          )}
          {lecture.status === "published" && onAssignments && (
            <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); onAssignments(); }} className="gap-1.5 h-8 text-xs text-orange-600 border-orange-500/30 hover:bg-orange-55">
              <ListChecks className="w-3.5 h-3.5" /> Assignments
            </Button>
          )}
          {(queuePosition ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200/70 rounded-lg px-3 py-1.5">
              <Clock className="w-3 h-3 shrink-0" /> In queue #{queuePosition}
            </div>
          )}
          {queuePosition === -1 && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200/70 rounded-lg px-3 py-1.5">
              <Loader2 className="w-3 h-3 shrink-0 animate-spin" /> Starting...
            </div>
          )}
          {transcriptFailed && isYouTube && (
            <>
              <Button
                variant="outline" size="sm"
                onClick={e => { e.stopPropagation(); openPanel("notes"); }}
                className={cn("gap-1.5 h-8 text-xs", panel === "notes" ? "bg-violet-50 border-violet-300 text-violet-700" : "text-violet-600 border-violet-300/60 hover:bg-violet-50")}
              >
                <FileText className="w-3 h-3" />
                {panel === "notes" ? "Cancel" : "Upload Notes"}
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={e => { e.stopPropagation(); openPanel("transcript"); }}
                className={cn("gap-1.5 h-8 text-xs", panel === "transcript" ? "bg-blue-50 border-blue-300 text-blue-700" : "text-blue-600 border-blue-300/60 hover:bg-blue-50")}
              >
                <Mic className="w-3 h-3" />
                {panel === "transcript" ? "Cancel" : "Upload Transcript"}
              </Button>
            </>
          )}
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="ml-auto text-slate-300 hover:text-rose-500 transition-colors p-1" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Inline paste panel */}
      {panel && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-2 bg-slate-50">
          <p className="text-xs font-semibold text-slate-800">
            {panel === "notes"
              ? "Paste notes (markdown supported) — students will see these as AI notes"
              : "Paste the lecture transcript — plain text, one sentence per line"}
          </p>
          <textarea
            value={panelText}
            onChange={e => setPanelText(e.target.value)}
            rows={6}
            placeholder={panel === "notes"
              ? "# Henry's Law\n\n## Key Concepts\n- At constant temperature, the amount of dissolved gas...\n\n## Formula\n p = K_H · c"
              : "In this lecture we will study Henry's Law. Henry's Law states that at constant temperature..."}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/40"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={e => { e.stopPropagation(); savePanel(); }}
              disabled={saving || !panelText.trim()}
              className="gap-1.5 h-8 text-xs"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Save {panel === "notes" ? "Notes" : "Transcript"}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground"
              onClick={e => { e.stopPropagation(); setPanel(null); setPanelText(""); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── YouTube Manual Notes Panel ───────────────────────────────────────────────
// Shown when YouTube caption fetch fails. Teacher can paste notes directly.

function YoutubeManualNotesPanel({ lecture }: { lecture: Lecture }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const updateLecture = useUpdateLecture();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await updateLecture.mutateAsync({
        id: lecture.id,
        aiNotesMarkdown: text.trim(),
        transcriptStatus: "done" as any,
      });
      queryClient.invalidateQueries({ queryKey: ["lectures"] });
      toast({ title: "Notes saved", description: "Your notes are now visible to students." });
      setOpen(false);
      setText("");
    } catch {
      toast({ title: "Failed to save notes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800">AI notes could not be generated</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            YouTube captions are unavailable for this video. You can write notes manually — students will see them just like AI-generated notes.
          </p>
        </div>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-100 border border-amber-300 text-xs font-bold text-amber-800 hover:bg-amber-200 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" /> Write Notes Manually
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-amber-800">Paste or type notes (markdown supported):</p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={10}
            placeholder={"# Topic Title\n\n## Key Points\n- Point 1\n- Point 2\n\n## Summary\n..."}
            className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-300"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || !text.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Save Notes
            </button>
            <button
              onClick={() => { setOpen(false); setText(""); }}
              className="px-4 py-2 rounded-xl border border-amber-300 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Live Class Card ──────────────────────────────────────────────────────────

function BroadcastCard({
  broadcast,
  contentLecture,
  onDelete,
  onShowKey,
  onViewSummary,
  onGenerateTranscript,
  onGenerateNotes,
  onGenerateQuiz,
  onViewStats,
  onReview,
  onRefreshVisuals,
  isGeneratingNotes,
  queuePosition,
}: {
  broadcast: BroadcastLecture;
  contentLecture?: Lecture;
  onDelete: () => void;
  onShowKey: () => void;
  onViewSummary: () => void;
  onGenerateTranscript: () => void;
  onGenerateNotes: () => void;
  onGenerateQuiz: () => void;
  onViewStats: () => void;
  onReview?: () => void;
  onRefreshVisuals?: () => Promise<void>;
  isGeneratingNotes?: boolean;
  queuePosition?: number;
}) {
  const navigate = useNavigate();
  const [watchUrl, setWatchUrl] = useState<string | null>(null);
  const [watchLoading, setWatchLoading] = useState(false);
  const [watchError, setWatchError] = useState('');
  const isLive = broadcast.status === 'LIVE';
  const isEnded = broadcast.status === 'ENDED' || broadcast.status === 'PROCESSED' || broadcast.status === 'PROCESSING_FAILED';
  const isScheduled = !isLive && !isEnded;

  const fmtDur = (a?: string | null, b?: string | null) => {
    if (!a || !b) return null;
    const s = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };
  const dur = fmtDur(broadcast.startedAt, broadcast.endedAt);

  const isExpired = isScheduled && broadcast.scheduledAt && new Date(broadcast.scheduledAt) < new Date(new Date().setHours(0, 0, 0, 0));

  const effectiveEnded = isEnded || isExpired;

  const toggleRecording = async () => {
    if (watchUrl) {
      setWatchUrl(null);
      setWatchError('');
      return;
    }
    setWatchLoading(true);
    setWatchError('');
    try {
      const result = await liveBroadcast.getRecordingUrl(broadcast.id);
      if (!result?.url) throw new Error('No playable recording URL was returned');
      setWatchUrl(result.url);
    } catch (error: any) {
      setWatchError(error?.response?.data?.message || error?.message || 'Recording could not be loaded');
    } finally {
      setWatchLoading(false);
    }
  };

  const customLecture = contentLecture
    ? {
        ...contentLecture,
        videoUrl: watchUrl || '',
        videoDurationSeconds: broadcast.durationSeconds || contentLecture.videoDurationSeconds,
      }
    : {
        id: broadcast.id,
        title: broadcast.title,
        videoUrl: watchUrl || '',
        status: "ended",
        createdAt: broadcast.createdAt || new Date().toISOString(),
        aiNotesMarkdown: "",
        transcript: "",
        quizCheckpoints: [],
        isFallback: true,
      } as any;

  return (
    <div className={cn(
      "bg-card border rounded-2xl overflow-hidden transition-shadow min-w-0 w-full",
      isLive ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]" : "border-border",
    )}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 pr-2">
            <p className="truncate font-black text-sm text-foreground" title={broadcast.title}>{broadcast.title}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              {(broadcast.scheduledAt || broadcast.createdAt) && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {fmtDateTime(broadcast.scheduledAt ?? broadcast.createdAt!)}
                </span>
              )}
              {dur && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{dur}</span>}
            </div>
          </div>
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-black px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-600 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> Live Now
            </span>
          ) : effectiveEnded ? (
            <span className="inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-500 shrink-0">Ended</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full border border-violet-200 bg-violet-50 text-violet-600 shrink-0">
              <AlarmClock className="w-3 h-3" /> Scheduled
            </span>
          )}
        </div>

        {isScheduled && !isExpired && (
          <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2">
            <AlarmClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
            <p className="text-[11px] font-medium text-violet-700">
              Start OBS and paste your stream key — class goes LIVE automatically when you start streaming.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap border-t border-border pt-3">
          {broadcast.streamKey && (
            <Button size="sm" variant="outline" onClick={onShowKey} className="gap-1.5 h-8 text-xs">
              <Eye className="w-3.5 h-3.5" /> Stream Info
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              if (isScheduled) {
                onShowKey();
              } else {
                navigate(`/teacher/live/${broadcast.id}`, { state: { showSummary: isEnded } });
              }
            }}
            className={cn(
              "gap-1.5 h-8 text-xs text-white border-0 transition-colors",
              isLive ? "bg-red-500 hover:bg-red-600" : "bg-slate-900 hover:bg-slate-800"
            )}
          >
            {isLive ? (
              <>
                <Radio className="w-3.5 h-3.5" /> Open Live
              </>
            ) : isEnded ? (
              <>
                View Summary <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
          {broadcast.status === 'PROCESSED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={toggleRecording}
              disabled={watchLoading}
              className="gap-1.5 h-8 text-xs"
            >
              {watchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
              Watch Video
            </Button>
          )}
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">OBS</span>
          <button onClick={onDelete} className="ml-auto text-muted-foreground hover:text-red-500 transition-colors p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {watchError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{watchError}</p>
        )}
      </div>
      {watchUrl && (
        <LectureDetailPanel
          lecture={customLecture}
          onClose={() => setWatchUrl(null)}
          onReview={() => {
            setWatchUrl(null);
            onReview?.();
          }}
          onRetranscribe={onGenerateTranscript}
          onRegenerateNotes={onGenerateNotes}
          onRefreshVisuals={async () => {
            if (onRefreshVisuals) await onRefreshVisuals();
          }}
          isGeneratingNotes={isGeneratingNotes}
          queuePosition={queuePosition}
          displayMode="dashboard"
        />
      )}
    </div>
  );
}

function LiveCard({ lecture, onDelete, onStartClass }: { lecture: Lecture; onDelete: () => void; onStartClass?: () => void }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recordingUrl, setRecordingUrl] = useState("");
  const [showRecordingInput, setShowRecordingInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const recordingReady = !!lecture.videoUrl;
  const recordingPending = lecture.status === "ended" && !recordingReady;

  const startClass = () => {
    if (onStartClass) { onStartClass(); return; }
    navigate(`/live/${lecture.id}`);
  };

  const endClass = async () => {
    try {
      const result = await import("@/lib/api/live-class").then(m => m.endLiveClass(lecture.id));
      toast({
        title: "Class ended",
        description: result.recordingUrl
          ? "Recording has been saved as a recorded lecture."
          : "Attendance marked. Recording is still processing.",
      });
      queryClient.invalidateQueries({ queryKey: ["teacher", "lectures"] });
    } catch { toast({ title: "Failed to end class", variant: "destructive" }); }
  };

  const saveRecording = async () => {
    if (!recordingUrl) return;
    setIsSaving(true);
    try {
      await import("@/lib/api/live-class").then(m => m.attachRecording(lecture.id, recordingUrl));
      toast({ title: "Recording attached", description: "Saved as a recorded lecture. AI notes are now processing." });
      setShowRecordingInput(false);
      queryClient.invalidateQueries({ queryKey: ["teacher", "lectures"] });
    } catch { toast({ title: "Failed to attach recording", variant: "destructive" }); }
    finally { setIsSaving(false); }
  };

  const isPast = lecture.scheduledAt ? new Date(lecture.scheduledAt) < new Date() : false;

  return (
    <div className={cn("bg-card border rounded-2xl overflow-hidden min-w-0 w-full", lecture.status === "live" ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]" : "border-border")}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 pr-2">
            <LectureTitleWithEdit lecture={lecture} compact />
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{lecture.batch?.name}</span>
              {lecture.scheduledAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {fmtDateTime(lecture.scheduledAt)}
                </span>
              )}
            </div>
          </div>
          <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border shrink-0", statusColor[lecture.status] ?? "bg-secondary text-foreground border-border")}>
            {lecture.status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            {statusLabel[lecture.status] ?? lecture.status}
          </span>
        </div>

        {lecture.liveMeetingUrl && lecture.status !== "ended" && (
          <a href={lecture.liveMeetingUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-xs text-primary font-medium hover:underline">
            <ExternalLink className="w-3.5 h-3.5" />
            {lecture.liveMeetingUrl.includes("meet.google.com") ? "Open Google Meet" : "Join Meeting"}
          </a>
        )}

        {recordingPending && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <Loader2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-spin" />
            <p className="text-xs text-amber-800">
              Recording is not available yet. It will appear here automatically, or you can attach a recording URL manually.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {lecture.status === "scheduled" && (
            <Button size="sm" onClick={startClass} className="gap-1.5 h-8 text-xs bg-red-500 hover:bg-red-600 text-white border-0">
              <Radio className="w-3.5 h-3.5" /> {onStartClass ? "Open OBS Dashboard" : (isPast ? "Start Class Now" : "Open Live Room")}
            </Button>
          )}
          {lecture.status === "live" && (
            <>
              <Button size="sm" onClick={() => navigate(`/live/${lecture.id}`)} className="gap-1.5 h-8 text-xs bg-red-500 hover:bg-red-600 text-white border-0">
                <Radio className="w-3.5 h-3.5" /> Enter Live Room
              </Button>
              <Button size="sm" onClick={endClass} variant="outline" className="gap-1.5 h-8 text-xs border-red-500/40 text-red-600 hover:bg-red-500/10">
                <StopCircle className="w-3.5 h-3.5" /> End Class
              </Button>
            </>
          )}
          {lecture.status === "ended" && !recordingReady && !showRecordingInput && (
            <Button size="sm" variant="outline" onClick={() => setShowRecordingInput(true)} className="gap-1.5 h-8 text-xs">
              <Link2 className="w-3.5 h-3.5" /> Attach Recording
            </Button>
          )}
          <button onClick={onDelete} className="ml-auto text-muted-foreground hover:text-red-500 transition-colors p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {showRecordingInput && (
          <div className="flex gap-2">
            <Input value={recordingUrl} onChange={e => setRecordingUrl(e.target.value)}
              placeholder="Paste recording URL…" className="h-9 text-sm flex-1" />
            <Button size="sm" onClick={saveRecording} disabled={isSaving || !recordingUrl} className="h-9 shrink-0">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowRecordingInput(false)} className="h-9">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {lecture.status === "ended" && lecture.videoUrl && (
          <a href={lecture.videoUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-xs text-primary font-medium hover:underline">
            <PlayCircle className="w-3.5 h-3.5" /> Watch Recording
          </a>
        )}

        {lecture.status === "scheduled" && !isPast && (
          <div className="flex items-center gap-2 bg-violet-500/5 border border-violet-500/20 rounded-xl px-3 py-2">
            <AlarmClock className="w-4 h-4 text-violet-500 shrink-0" />
            <p className="text-xs text-muted-foreground">30-min reminder will be sent automatically to all students.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TeacherLecturesPage = ({ defaultTab = "live" }: { defaultTab?: "live" | "recorded" }) => {
  const confirm = useConfirm();
  const isCompactLayout = useIsCompactLayout();
  const prefersReducedMotion = useReducedMotion();
  const lightMotion = isCompactLayout || !!prefersReducedMotion;
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterBatch = searchParams.get("batchId") ?? "";
  const filterSubjectId = searchParams.get("subjectId") ?? "";
  const filterChapterId = searchParams.get("chapterId") ?? "";
  const filterTopicId = searchParams.get("topicId") ?? "";

  const setBatchFilter = (id: string) => {
    const p = new URLSearchParams(searchParams);
    if (id) p.set("batchId", id); else p.delete("batchId");
    p.delete("subjectId");
    p.delete("chapterId");
    p.delete("topicId");
    setSearchParams(p, { replace: true });
  };
  const setSubjectFilter = (id: string) => {
    const p = new URLSearchParams(searchParams);
    if (id) p.set("subjectId", id); else p.delete("subjectId");
    p.delete("chapterId");
    p.delete("topicId");
    setSearchParams(p, { replace: true });
  };
  const setChapterFilter = (id: string) => {
    const p = new URLSearchParams(searchParams);
    if (id) p.set("chapterId", id); else p.delete("chapterId");
    p.delete("topicId");
    setSearchParams(p, { replace: true });
  };
  const setTopicFilter = (id: string) => {
    const p = new URLSearchParams(searchParams);
    if (id) p.set("topicId", id); else p.delete("topicId");
    setSearchParams(p, { replace: true });
  };

  const { data: batches } = useMyBatches();
  const batchList = batches ?? [];

  /** Batch for lecture list + curriculum: explicit URL filter, else the only course when teacher has one. */
  const resolvedBatchId = useMemo(() => {
    if (filterBatch) return filterBatch;
    if (batchList.length === 1) return batchList[0].id;
    return undefined;
  }, [filterBatch, batchList]);

  const { data: lectures, isLoading } = useMyLectures({
    batchId: resolvedBatchId,
    limit: 500,
  });

  const { data: curriculumSubjectsRaw = [], isLoading: curriculumLoading } = useSubjects(resolvedBatchId);

  const deleteLecture = useDeleteLecture();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"recorded" | "live">(defaultTab);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  const [showUpload, setShowUpload] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);


  // ── OBS / live-broadcast state ──────────────────────────────────────────────
  const [broadcastLectures, setBroadcastLectures] = useState<BroadcastLecture[]>([]);
  const [obsCredentials, setObsCredentials] = useState<BroadcastCreated | null>(null);
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsShowKey, setObsShowKey] = useState(false);
  const [selectedStats, setSelectedStats] = useState<BroadcastStats | null>(null);

  const handleViewSummary = async (broadcastId: string) => {
    try {
      const stats = await liveBroadcast.getStats(broadcastId);
      setSelectedStats(stats);
    } catch {
      toast({ title: "Failed to load session stats", variant: "destructive" });
    }
  };

  const fetchBroadcasts = useCallback(async () => {
    try {
      const data = await liveBroadcast.list();
      setBroadcastLectures(Array.isArray(data) ? data : []);
    }
    catch { /* non-fatal */ }
  }, []);

  useEffect(() => { fetchBroadcasts(); }, [fetchBroadcasts]);

  /** When teacher clicks "Start Class Now" on a content lecture, find the
   *  matching OBS broadcast (by title) and show the OBS credentials modal.
   *  If not found locally, refresh the list first; if still absent, create
   *  a new broadcast on-the-fly so the teacher always gets stream credentials. */
  const handleStartObsForLecture = useCallback(async (lecture: Lecture) => {
    const normalize = (s: string) => s.trim().toLowerCase();
    let list = broadcastLectures;

    // Try to find a match in the already-loaded list
    let match = list.find(b => normalize(b.title) === normalize(lecture.title));

    // Refresh once if not found — creation may have happened before the last fetch
    if (!match) {
      try {
        list = await liveBroadcast.list();
        setBroadcastLectures(list);
        match = list.find(b => normalize(b.title) === normalize(lecture.title));
      } catch { /* ignore */ }
    }

    // Still not found — create a broadcast on-the-fly and navigate to dashboard
    if (!match) {
      try {
        const created = await liveBroadcast.create({
          title: lecture.title,
          scheduledAt: lecture.scheduledAt ?? undefined,
          batchId: lecture.batchId || lecture.batch?.id || undefined,
          subjectId: lecture.subject?.id || undefined,
          batchName: lecture.batch?.name || undefined,
          subjectName: lecture.subject?.name || undefined,
          description: lecture.description || undefined,
        });
        await fetchBroadcasts();
        if (created?.lectureId) {
          navigate(`/teacher/live/${created.lectureId}`);
        } else {
          toast({ title: "Broadcast created but could not open dashboard", variant: "destructive" });
        }
      } catch {
        toast({ title: "Could not create stream", variant: "destructive" });
      }
      return;
    }

    // Navigate directly to the OBS teacher dashboard — credentials are shown there
    navigate(`/teacher/live/${match.id}`);
  }, [broadcastLectures, fetchBroadcasts, navigate, toast]);
  const [viewLecture, setViewLecture] = useState<Lecture | null>(null);
  // Store only the ID so the panel always gets the latest live data from the
  // lectures list (fixes the infinite-spinner-after-transcription bug).
  const [reviewLectureId, setReviewLectureId] = useState<string | null>(null);
  const reviewLecture = useMemo(
    () => (reviewLectureId ? (lectures ?? []).find(l => l.id === reviewLectureId) ?? null : null),
    [reviewLectureId, lectures],
  );
  const [statsLecture, setStatsLecture] = useState<Lecture | null>(null);
  const [assignmentLecture, setAssignmentLecture] = useState<Lecture | null>(null);


  // Track per-lecture AI processing step for animated UI (0–3)
  const [processingSteps, setProcessingSteps] = useState<Record<string, number>>({});

  const all = lectures ?? [];
  const curriculumSubjects = Array.isArray(curriculumSubjectsRaw) ? curriculumSubjectsRaw : [];

  const subjectOptions = useMemo(() => curriculumSubjects
    .filter(s => s.isActive !== false)
    .map(s => ({ id: s.id, name: s.name, sortOrder: s.sortOrder ?? 0 }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [curriculumSubjects]);

  const subjectNode = useMemo(
    () => curriculumSubjects.find(s => s.id === filterSubjectId),
    [curriculumSubjects, filterSubjectId],
  );

  const chapterOptions = useMemo(() => {
    const ch = subjectNode?.chapters ?? [];
    return ch
      .filter(c => c.isActive !== false)
      .map(c => ({ id: c.id, name: c.name, sortOrder: c.sortOrder ?? 0 }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [subjectNode]);

  const chapterNode = useMemo(
    () => subjectNode?.chapters?.find(c => c.id === filterChapterId),
    [subjectNode, filterChapterId],
  );

  const topicOptions = useMemo(() => {
    const topics = chapterNode?.topics ?? [];
    return topics
      .filter(t => t.isActive !== false)
      .map(t => ({ id: t.id, name: t.name, sortOrder: t.sortOrder ?? 0 }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [chapterNode]);

  const topicIdsInSubject = useMemo(() => {
    if (!subjectNode) return null;
    const ids = new Set<string>();
    for (const ch of subjectNode.chapters ?? []) {
      for (const top of ch.topics ?? []) ids.add(top.id);
    }
    return ids;
  }, [subjectNode]);

  const topicIdsInChapter = useMemo(() => {
    if (!chapterNode?.topics?.length) return null;
    return new Set(chapterNode.topics.map(t => t.id));
  }, [chapterNode]);

  const filtered = useMemo(() => {
    let list = all;
    if (filterTopicId) {
      list = list.filter(l => (l.topicId ?? l.topic?.id) === filterTopicId);
    } else if (filterChapterId) {
      list = list.filter(l => {
        const tid = l.topicId ?? l.topic?.id;
        const cid = l.topic?.chapter?.id || (l.topic as any)?.chapterId;
        if (cid === filterChapterId) return true;
        return tid != null && topicIdsInChapter != null && topicIdsInChapter.has(tid);
      });
    } else if (filterSubjectId) {
      list = list.filter(l => {
        const tid = l.topicId ?? l.topic?.id;
        const sid = l.topic?.chapter?.subject?.id || (l.topic?.chapter as any)?.subjectId || l.subject?.id || (l as any)?.subjectId;
        if (sid === filterSubjectId) return true;
        return tid != null && topicIdsInSubject != null && topicIdsInSubject.has(tid);
      });
    }
    return list;
  }, [all, filterTopicId, filterChapterId, filterSubjectId, topicIdsInChapter, topicIdsInSubject]);

  // Handle deep linking from calendar
  useEffect(() => {
    if (searchParams.get("action") === "assignments" && searchParams.get("lectureId")) {
      const lid = searchParams.get("lectureId");
      if (filtered) {
        const found = filtered.find(l => l.id === lid);
        if (found && !assignmentLecture) {
          setAssignmentLecture(found);
          // Remove from url so it doesn't re-open on every render if closed
          searchParams.delete("action");
          searchParams.delete("lectureId");
          setSearchParams(searchParams, { replace: true });
        }
      }
    }
  }, [searchParams, filtered, assignmentLecture, setSearchParams]);

  // Handle deep linking to auto-play/view recorded or live lecture
  useEffect(() => {
    if (!searchParams.get("action") && searchParams.get("lectureId")) {
      const lid = searchParams.get("lectureId");
      if (filtered && filtered.length > 0 && !viewLecture) {
        const found = filtered.find(l => l.id === lid);
        if (found) {
          setViewLecture(found);
          // Remove from url so it doesn't re-open on every render if closed
          const p = new URLSearchParams(searchParams);
          p.delete("lectureId");
          setSearchParams(p, { replace: true });
        }
      }
    }
  }, [searchParams, filtered, viewLecture, setSearchParams]);


  const recorded = filtered.filter(l => l.type === "recorded");
  const live = filtered.filter(l => l.type === "live");
  const sortedLive = useMemo(
    () =>
      [...live].sort((a, b) => {
        const order = { live: 0, scheduled: 1, ended: 2 };
        return (order[a.status as keyof typeof order] ?? 9) - (order[b.status as keyof typeof order] ?? 9);
      }),
    [live],
  );
  const initialBatchSize = isCompactLayout ? 8 : 14;
  const loadMoreBatchSize = isCompactLayout ? 6 : 10;
  const [recordedVisibleCount, setRecordedVisibleCount] = useState(initialBatchSize);
  const [liveVisibleCount, setLiveVisibleCount] = useState(initialBatchSize);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setRecordedVisibleCount(prev => {
      const max = recorded.length || initialBatchSize;
      return Math.max(initialBatchSize, Math.min(prev, max));
    });
  }, [recorded.length, initialBatchSize]);

  useEffect(() => {
    setLiveVisibleCount(prev => {
      const max = sortedLive.length || initialBatchSize;
      return Math.max(initialBatchSize, Math.min(prev, max));
    });
  }, [sortedLive.length, initialBatchSize]);

  const visibleRecorded = useMemo(
    () => recorded.slice(0, recordedVisibleCount),
    [recorded, recordedVisibleCount],
  );
  const visibleLive = useMemo(
    () => sortedLive.slice(0, liveVisibleCount),
    [sortedLive, liveVisibleCount],
  );
  const canLoadMore =
    tab === "recorded"
      ? visibleRecorded.length < recorded.length
      : visibleLive.length < sortedLive.length;

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !canLoadMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (tab === "recorded") {
          setRecordedVisibleCount((prev) => Math.min(prev + loadMoreBatchSize, recorded.length));
        } else {
          setLiveVisibleCount((prev) => Math.min(prev + loadMoreBatchSize, sortedLive.length));
        }
      },
      { rootMargin: isCompactLayout ? "220px 0px" : "320px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, isLoading, isCompactLayout, loadMoreBatchSize, recorded.length, sortedLive.length, tab]);

  // Track which lecture IDs have notes generation in progress (client-side only)
  const [notesGeneratingIds, setNotesGeneratingIds] = useState<Set<string>>(new Set());
  const notesGenerationBaselineRef = useRef<Record<string, string | null | undefined>>({});

  // ── AI job queue: one transcription / notes-generation job at a time ─────────
  type ProcessingJob = { lectureId: string; action: "retranscribe" | "regenerate" };
  const [activeJob, setActiveJob] = useState<ProcessingJob | null>(null);
  const [jobQueue, setJobQueue] = useState<ProcessingJob[]>([]);

  // Remember previous transcriptStatus per lecture so we can detect transitions
  const prevTranscriptStatusRef = useRef<Record<string, string>>({});

  // When a lecture's transcriptStatus transitions to "done", Phase 1 is complete.
  // We notify the teacher so they can manually trigger notes generation.
  useEffect(() => {
    const prev = prevTranscriptStatusRef.current;
    (lectures ?? []).forEach(l => {
      const wasNotDone = prev[l.id] !== undefined && prev[l.id] !== "done";
      const isNowDone = l.transcriptStatus === "done";
      if (wasNotDone && isNowDone && !l.aiNotesMarkdown) {
        toast({
          title: "Transcription Ready",
          description: `Transcription for "${l.title}" is complete. Click 'Generate Notes' to continue.`
        });
      }
    });
    // Update snapshot
    const snap: Record<string, string> = {};
    (lectures ?? []).forEach(l => { if (l.transcriptStatus) snap[l.id] = l.transcriptStatus; });
    prevTranscriptStatusRef.current = snap;
  }, [lectures]);

  // Remove from notesGeneratingIds once aiNotesMarkdown appears on the lecture
  useEffect(() => {
    if (notesGeneratingIds.size === 0) return;
    const done = (lectures ?? []).filter(l => {
      if (!notesGeneratingIds.has(l.id) || !l.aiNotesMarkdown) return false;
      const baseline = notesGenerationBaselineRef.current[l.id];
      return baseline === undefined || l.aiNotesMarkdown === "__NOTES_FAILED__" || l.aiNotesMarkdown !== baseline;
    });
    if (done.length === 0) return;
    setNotesGeneratingIds(prev => {
      const next = new Set(prev);
      done.forEach(l => next.delete(l.id));
      return next;
    });
    done.forEach(l => {
      delete notesGenerationBaselineRef.current[l.id];
      if (l.aiNotesMarkdown === "__NOTES_FAILED__") {
        toast({ title: "Notes generation failed", description: `Could not generate notes for "${l.title}".`, variant: "destructive" });
      } else {
        toast({ title: "Notes ready! ✨", description: `Notes for "${l.title}" are ready to review.` });
      }
    });
  }, [lectures, notesGeneratingIds, toast]);

  // Keep polling for any lecture that has a transcript but no notes and was updated
  // within the last 10 minutes — catches the case where the frontend missed a status
  // transition (e.g., polling was off when a retry succeeded while notes were generating).
  const _TEN_MIN_MS = 10 * 60 * 1000;
  const hasRecentTranscriptWithoutNotes = recorded.some(l =>
    l.transcriptStatus === "done" &&
    !l.aiNotesMarkdown &&
    (Date.now() - new Date((l as any).updatedAt ?? (l as any).createdAt).getTime()) < _TEN_MIN_MS
  );

  // Auto-poll every 5s when any recorded lecture is still processing
  // (handles the case where the user refreshes mid-processing)
  const hasProcessing = Object.keys(processingSteps).length > 0
    || notesGeneratingIds.size > 0
    || hasRecentTranscriptWithoutNotes
    || recorded.some(l =>
      l.status === "processing" ||
      l.transcriptStatus === "processing" ||
      l.transcriptStatus === "pending"
    );
  useEffect(() => {
    if (!hasProcessing) return;
    const id = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "lectures"] });
    }, 5000);
    return () => clearInterval(id);
  }, [hasProcessing, queryClient]);

  // Dequeue and fire the next job whenever the active slot is free.
  // Uses IIFE inside the effect so React doesn't complain about async effects.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeJob !== null || jobQueue.length === 0) return;
    const next = jobQueue[0];
    setJobQueue(prev => prev.slice(1));
    setActiveJob(next);
    (async () => {
      try {
        if (next.action === "retranscribe") {
          await retranscribeLecture(next.lectureId);
          toast({ title: "Transcription started", description: "AI is re-transcribing the lecture." });
        } else {
          setNotesGeneratingIds(prev => new Set(prev).add(next.lectureId));
          await regenerateNotes(next.lectureId);
          toast({ title: "Notes generation started", description: "AI is generating notes from the transcript." });
        }
        queryClient.invalidateQueries({ queryKey: ["teacher", "lectures"] });
      } catch {
        toast({ title: "Failed to start job", variant: "destructive" });
        setActiveJob(null);
      }
    })();
  }, [activeJob, jobQueue]);

  // Clear activeJob when the backend task finishes (detected via polling).
  useEffect(() => {
    if (!activeJob) return;
    const lecture = (lectures ?? []).find(l => l.id === activeJob.lectureId);
    if (!lecture) return;
    if (activeJob.action === "retranscribe") {
      if (lecture.transcriptStatus === "done" || lecture.transcriptStatus === "failed") setActiveJob(null);
    } else {
      const baseline = notesGenerationBaselineRef.current[lecture.id];
      if (
        lecture.transcriptStatus === "failed" ||
        (lecture.aiNotesMarkdown && (baseline === undefined || lecture.aiNotesMarkdown === "__NOTES_FAILED__" || lecture.aiNotesMarkdown !== baseline))
      ) {
        setActiveJob(null);
      }
    }
  }, [activeJob, lectures]);

  // Track which lecture IDs were just uploaded (so we can auto-open review when AI finishes)
  const [pendingReviewIds, setPendingReviewIds] = useState<Set<string>>(new Set());

  // After a lecture is uploaded, animate the processing steps UI while the
  // backend handles AI (speech-to-text + notes via Django).
  // We do NOT call the AI from the frontend — the backend already does it.
  const triggerAiProcessing = useCallback((lectureId: string) => {
    // Mark this lecture as pending review so we can auto-open the panel
    setPendingReviewIds(prev => new Set(prev).add(lectureId));

    // Instantly refresh list to show the new lecture in 'processing' state
    queryClient.invalidateQueries({ queryKey: ["teacher", "lectures"] });
    queryClient.invalidateQueries({ queryKey: ["teacher", "lectures"] });
  }, [queryClient]);

  // Auto-open the review panel — only once notes are actually ready.
  // Three cases handled:
  //   1. aiNotesMarkdown arrived → open panel + success toast
  //   2. transcriptStatus === "failed" → error toast only, do NOT open panel
  //   3. transcriptStatus === "done" but no notes yet (Phase 2 still running) → keep waiting
  //   4. Stuck safety valve: transcript done but no notes for >5 min → open panel without notes
  useEffect(() => {
    if (pendingReviewIds.size === 0) return;

    // Case 1: notes ready — open panel
    const withNotes = (lectures ?? []).find(
      l => pendingReviewIds.has(l.id) && !!l.aiNotesMarkdown && l.aiNotesMarkdown !== "__NOTES_FAILED__",
    );
    if (withNotes) {
      setPendingReviewIds(prev => { const n = new Set(prev); n.delete(withNotes.id); return n; });
      setReviewLectureId(withNotes.id);
      toast({ title: "AI notes ready! ✨", description: "Review and publish when you're satisfied." });
      return;
    }

    // Case 2: transcription failed — toast only, remove from pending
    const failed = (lectures ?? []).find(
      l => pendingReviewIds.has(l.id)
        && (l.status === "draft" || l.status === "published")
        && l.transcriptStatus === "failed",
    );
    if (failed) {
      setPendingReviewIds(prev => { const n = new Set(prev); n.delete(failed.id); return n; });
      toast({
        title: "Transcription failed",
        description: isYouTubeUrl(failed.videoUrl)
          ? YOUTUBE_LECTURE_CAPTIONS_HINT
          : "Could not transcribe audio. Use \"Retry Transcription\" on the lecture card.",
        variant: "destructive",
      });
      return;
    }

    // Case 4: transcript done but notes generation explicitly failed
    const failedNotes = (lectures ?? []).find(
      l => pendingReviewIds.has(l.id)
        && l.transcriptStatus === "done"
        && l.aiNotesMarkdown === "__NOTES_FAILED__"
    );
    if (failedNotes) {
      setPendingReviewIds(prev => { const n = new Set(prev); n.delete(failedNotes.id); return n; });
      setReviewLectureId(failedNotes.id);
      toast({
        title: "Notes Failed",
        description: "Notes generation failed. You can add notes manually or click \"Generate Notes\" to retry.",
        variant: "destructive"
      });
    }
    // Case 3: transcript done but notes still generating — keep waiting (no-op)
  }, [lectures, pendingReviewIds, toast]);

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this lecture? This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteLecture.mutateAsync(id);
      toast({ title: "Deleted" });
    } catch { toast({ title: "Delete failed", variant: "destructive" }); }
  };

  // Enqueue a job — silently deduplicate if already queued/active for this lecture.
  const submitJob = useCallback((lectureId: string, action: "retranscribe" | "regenerate") => {
    if (activeJob?.lectureId === lectureId || jobQueue.some(j => j.lectureId === lectureId)) return;
    if (action === "regenerate") {
      const lecture = (lectures ?? []).find(l => l.id === lectureId);
      notesGenerationBaselineRef.current[lectureId] = lecture?.aiNotesMarkdown;
    }
    const qPos = jobQueue.length + (activeJob ? 1 : 0);
    setJobQueue(q => [...q, { lectureId, action }]);
    if (qPos > 0) {
      toast({ title: "Added to queue", description: `Will start after the current job finishes (position ${qPos + 1}).` });
    }
  }, [activeJob, jobQueue, lectures, toast]);

  const handleRetranscribe = useCallback((id: string) => submitJob(id, "retranscribe"), [submitJob]);
  const handleRegenerateNotes = useCallback((id: string) => submitJob(id, "regenerate"), [submitJob]);
  const handleRefreshNoteVisuals = useCallback(async (id: string) => {
    try {
      const result = await refreshLectureNoteVisuals(id);
      await queryClient.invalidateQueries({ queryKey: ["teacher", "lectures"] });
      toast({
        title: "Visuals refreshed",
        description: `${result.imageCount} educational image${result.imageCount === 1 ? "" : "s"} embedded in the notes.`,
      });
    } catch (error: any) {
      toast({
        title: "Could not refresh visuals",
        description: error?.message || "No suitable educational images were found.",
        variant: "destructive",
      });
    }
  }, [queryClient, toast]);

  if (selectedStats) {
    return (
      <PostClassSummary
        stats={selectedStats}
        onDone={() => setSelectedStats(null)}
      />
    );
  }

  return (
    <MotionConfig reducedMotion={lightMotion ? "always" : "never"}>
      <>
        {/* Panels are siblings of (not inside) the motion.div — position:fixed children
        of a transformed element don't position relative to the viewport */}
        <AnimatePresence>
          {viewLecture && (() => {
            const activeLecture = (lectures ?? []).find(l => l.id === viewLecture.id) ?? viewLecture;
            return (
              <LectureDetailPanel
                key="lecture-detail"
                lecture={activeLecture}
                onClose={() => setViewLecture(null)}
                onReview={() => { setViewLecture(null); setReviewLectureId(activeLecture.id); }}
                onRetranscribe={() => handleRetranscribe(activeLecture.id)}
                onRegenerateNotes={() => handleRegenerateNotes(activeLecture.id)}
                onRefreshVisuals={() => handleRefreshNoteVisuals(activeLecture.id)}
                isGeneratingNotes={notesGeneratingIds.has(activeLecture.id)}
                queuePosition={
                  activeJob?.lectureId === activeLecture.id
                    ? -1
                    : (() => { const i = jobQueue.findIndex(j => j.lectureId === activeLecture.id); return i >= 0 ? i + 1 : 0; })()
                }
                displayMode="dashboard"
              />
            );
          })()}
          {reviewLecture && <NotesReviewPanel key="review" lecture={reviewLecture} onClose={() => setReviewLectureId(null)} isGeneratingNotes={reviewLecture ? notesGeneratingIds.has(reviewLecture.id) : false} />}
          {statsLecture && <StatsPanel key="stats" lecture={statsLecture} onClose={() => setStatsLecture(null)} />}
          {assignmentLecture && (
            <AssignmentManagerModal key="assignment" lecture={assignmentLecture} onClose={() => setAssignmentLecture(null)} />
          )}
          {showUpload && (
            <UploadModal
              key="upload"
              onClose={() => setShowUpload(false)}
              onSuccess={triggerAiProcessing}
              batches={batchList}
            />
          )}
          {showSchedule && (
            <ScheduleLiveModal
              key="schedule"
              onClose={(obs) => {
                setShowSchedule(false);
                if (obs) { setObsCredentials(obs); setObsShowKey(false); setShowObsModal(true); fetchBroadcasts(); }
              }}
              batches={batchList}
            />
          )}
        </AnimatePresence>

        {/* OBS Credentials Modal */}
        {showObsModal && obsCredentials && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowObsModal(false)} />
            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                </span>
                <h2 className="text-base font-black text-slate-900">Live Class Scheduled — OBS Stream Info</h2>
                <button onClick={() => setShowObsModal(false)} className="ml-auto grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4 p-6">
                {/* RTMP URL */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">RTMP URL</span>
                    <button onClick={() => { navigator.clipboard.writeText(obsCredentials.rtmpUrl); toast({ title: "RTMP URL copied" }); }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                  </div>
                  <code className="block w-full overflow-x-auto rounded-xl bg-slate-100 px-4 py-3 font-mono text-sm text-slate-800">{obsCredentials.rtmpUrl}</code>
                </div>
                {/* Stream Key */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">Stream Key</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setObsShowKey(s => !s)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700">
                        {obsShowKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {obsShowKey ? "Hide" : "Show"}
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(obsCredentials.streamKey); toast({ title: "Stream key copied" }); }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                    </div>
                  </div>
                  <code className="block w-full overflow-x-auto rounded-xl bg-slate-100 px-4 py-3 font-mono text-sm text-slate-800">
                    {obsShowKey ? (obsCredentials.streamKey || '—') : "•".repeat(Math.min((obsCredentials.streamKey ?? '').length, 32))}
                  </code>
                </div>
                <ol className="space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  <li><b>1.</b> Open OBS Studio → <b>Settings → Stream</b></li>
                  <li><b>2.</b> Service: <i>Custom</i> · Paste RTMP URL + Stream Key above</li>
                  <li><b>3.</b> Settings → Output → Encoding → Keyframe Interval: <b>1</b> (second)</li>
                  <li><b>4.</b> Click <b>Start Streaming</b> — your class goes LIVE automatically</li>
                </ol>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowObsModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                    Close
                  </button>
                  <button onClick={() => { setShowObsModal(false); navigate(`/teacher/live/${obsCredentials.lectureId}`); }}
                    className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 inline-flex items-center justify-center gap-2">
                    Open Live Dashboard <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 space-y-6 pb-20", lightMotion && "lite-motion")}
        >

          {/* ── Header ── */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {defaultTab === "live" ? "Live Classes" : "Recorded Lectures"}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {defaultTab === "live"
                  ? `${live.length} live classes`
                  : `${recorded.length} recorded lectures`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {defaultTab === "live" && (
                <button
                  onClick={() => setShowSchedule(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <Radio className="w-4 h-4" /> Schedule Live
                </button>
              )}
              {defaultTab === "recorded" && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black text-white transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #013889, #0257c8)" }}
                >
                  <Plus className="w-4 h-4" /> Upload Lecture
                </button>
              )}
            </div>
          </div>

          {/* ── Tabs + Filter ── */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div />

            {batchList.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={() => setBatchFilter("")}
                  className={cn("px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                    !filterBatch
                      ? "bg-white text-gray-900"
                      : "bg-slate-100 text-slate-500 hover:text-slate-700")}>
                  All
                </button>
                {batchList.map(b => (
                  <button type="button" key={b.id} onClick={() => setBatchFilter(b.id)}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                      filterBatch === b.id
                        ? "bg-white text-gray-900"
                        : "bg-slate-100 text-slate-500 hover:text-slate-700")}>
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Removed defaultTab === 'recorded' so filters show on Live tab too */}
          {resolvedBatchId && (curriculumLoading || subjectOptions.length > 0 || filterSubjectId || filterChapterId || filterTopicId) && (
            <div className="flex flex-row flex-nowrap items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 inline-flex items-center gap-1.5">
                Curriculum
                {curriculumLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
              </span>
              <div className="shrink-0 min-w-[160px]">
                <CustomSelect
                  value={filterSubjectId}
                  onChange={(val) => {
                    const p = new URLSearchParams(searchParams);
                    if (val) p.set("subjectId", val); else p.delete("subjectId");
                    p.delete("chapterId");
                    p.delete("topicId");
                    setSearchParams(p, { replace: true });
                  }}
                  options={[
                    { value: "", label: "All subjects" },
                    ...subjectOptions.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                  className="w-full"
                />
              </div>
              <div className="shrink-0 min-w-[160px]">
                <CustomSelect
                  value={filterChapterId}
                  onChange={(val) => {
                    const p = new URLSearchParams(searchParams);
                    if (val) p.set("chapterId", val); else p.delete("chapterId");
                    p.delete("topicId");
                    setSearchParams(p, { replace: true });
                  }}
                  options={[
                    { value: "", label: "All chapters" },
                    ...chapterOptions.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  disabled={!filterSubjectId}
                  className="w-full"
                />
              </div>
              <div className="shrink-0 min-w-[160px]">
                <CustomSelect
                  value={filterTopicId}
                  onChange={(val) => {
                    const p = new URLSearchParams(searchParams);
                    if (val) p.set("topicId", val); else p.delete("topicId");
                    setSearchParams(p, { replace: true });
                  }}
                  options={[
                    { value: "", label: "All topics" },
                    ...topicOptions.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                  disabled={!filterChapterId}
                  className="w-full"
                />
              </div>
              {(filterSubjectId || filterChapterId || filterTopicId) && (
                <button
                  type="button"
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.delete("subjectId");
                    p.delete("chapterId");
                    p.delete("topicId");
                    setSearchParams(p, { replace: true });
                  }}
                  className="shrink-0 h-9 px-3 rounded-xl text-xs font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  Clear topic filters
                </button>
              )}
            </div>
          )}


          {/* ── Content ── */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : tab === "recorded" ? (
            recorded.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-200">
                <Video className="w-14 h-14 text-gray-800 mb-3" />
                <p className="text-sm font-bold text-slate-400">No recorded lectures yet</p>
                <p className="text-xs text-gray-600 mt-1">Click "Upload Lecture" to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleRecorded.map(l => (
                  <RecordedCard
                    key={l.id}
                    lecture={l}
                    processingStep={processingSteps[l.id]}
                    isGeneratingNotes={notesGeneratingIds.has(l.id)}
                    queuePosition={
                      activeJob?.lectureId === l.id
                        ? -1
                        : (() => { const i = jobQueue.findIndex(j => j.lectureId === l.id); return i >= 0 ? i + 1 : 0; })()
                    }
                    onView={() => setViewLecture(l)}
                    onReview={() => setReviewLectureId(l.id)}
                    onStats={() => setStatsLecture(l)}
                    onDelete={() => handleDelete(l.id)}
                    onRetranscribe={() => handleRetranscribe(l.id)}
                    onRegenerateNotes={() => handleRegenerateNotes(l.id)}
                    onAssignments={() => setAssignmentLecture(l)}
                  />
                ))}
                <p className="text-xs text-slate-500 px-1">
                  Showing {visibleRecorded.length} of {recorded.length} recorded lectures
                </p>
              </div>
            )
          ) : (
            <div className="space-y-6">
              {/* ── Scheduled / Agora live classes ── */}
              {live.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                  <Radio className="w-14 h-14 text-gray-800 mb-3" />
                  <p className="text-sm font-bold text-slate-400">No live classes scheduled</p>
                  <p className="text-xs text-gray-600 mt-1">Click "Schedule Live" to schedule your first class.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleLive.map(l => (
                      <LiveCard key={l.id} lecture={l} onDelete={() => handleDelete(l.id)}
                        onStartClass={() => handleStartObsForLecture(l)} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 px-1">
                    Showing {visibleLive.length} of {sortedLive.length} live classes
                  </p>
                </div>
              )}

              {/* ── OBS Broadcast lectures ── */}
              {(() => {
                const visibleBroadcasts = broadcastLectures.filter(b => {
                  if (!resolvedBatchId) return true;
                  if (b.batchId) return b.batchId === resolvedBatchId;
                  return all.some(l => l.title.trim().toLowerCase() === b.title.trim().toLowerCase());
                });
                if (visibleBroadcasts.length === 0) return null;
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">OBS Stream Sessions</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{visibleBroadcasts.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visibleBroadcasts.map(b => {
                        const linkedLecture = all.find((lecture) =>
                          lecture.title.trim().toLowerCase() === b.title.trim().toLowerCase()
                          && (!b.batchId || (lecture.batchId || lecture.batch?.id) === b.batchId)
                        );
                        return <BroadcastCard
                          key={b.id}
                          broadcast={b}
                          contentLecture={linkedLecture}
                          onDelete={async () => {
                            if (!window.confirm('Delete this OBS broadcast? This cannot be undone.')) return;
                            try {
                              await liveBroadcast.delete(b.id);
                              setBroadcastLectures(prev => prev.filter(x => x.id !== b.id));
                              toast({ title: "Broadcast deleted" });
                            } catch { toast({ title: "Delete failed", variant: "destructive" }); }
                          }}
                          onShowKey={() => {
                            if (b.streamKey && b.rtmpUrl) {
                              setObsCredentials({ lectureId: b.id, streamKey: b.streamKey, rtmpUrl: b.rtmpUrl, playbackUrl: '' });
                              setObsShowKey(false);
                              setShowObsModal(true);
                            }
                          }}
                          onViewSummary={() => handleViewSummary(b.id)}
                          onGenerateTranscript={() => linkedLecture && handleRetranscribe(linkedLecture.id)}
                          onGenerateNotes={() => linkedLecture && handleRegenerateNotes(linkedLecture.id)}
                          onGenerateQuiz={async () => {
                            if (!linkedLecture) return;
                            try {
                              await generateQuizForLecture(linkedLecture.id);
                              toast({ title: 'Quiz generation started' });
                              queryClient.invalidateQueries({ queryKey: ['teacher', 'lectures'] });
                            } catch {
                              toast({ title: 'Could not generate quiz', variant: 'destructive' });
                            }
                          }}
                          onViewStats={() => linkedLecture && setStatsLecture(linkedLecture)}
                          onReview={() => linkedLecture && setReviewLectureId(linkedLecture.id)}
                          onRefreshVisuals={async () => { if (linkedLecture) await handleRefreshNoteVisuals(linkedLecture.id); }}
                          isGeneratingNotes={linkedLecture ? notesGeneratingIds.has(linkedLecture.id) : false}
                          queuePosition={
                            linkedLecture
                              ? (activeJob?.lectureId === linkedLecture.id
                                  ? -1
                                  : (() => { const i = jobQueue.findIndex(j => j.lectureId === linkedLecture.id); return i >= 0 ? i + 1 : 0; })())
                              : 0
                          }
                        />
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {canLoadMore && !isLoading && (
            <div ref={loadMoreRef} className="flex items-center justify-center py-2">
              <Loader2 className={cn("w-4 h-4 text-slate-400 animate-spin", lightMotion && "animate-none")} />
              <span className="ml-2 text-xs font-medium text-slate-500">Loading more lectures...</span>
            </div>
          )}

        </motion.div>
      </>
    </MotionConfig>
  );
};

export default TeacherLecturesPage;





