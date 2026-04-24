import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, BookOpen, Brain, Calendar, CheckCircle2, ChevronRight,
  Download, Eye, FileQuestion, Lock, PlayCircle, Sparkles,
  Target, Timer, Trophy, X, Loader2, AlertCircle,
} from "lucide-react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { FadeUp, Label as SLabel } from "@/components/landing/LandingPrimitives";
import { B, IN, P, T, gText } from "@/components/landing/DesignTokens";
import { useAuthStore } from "@/lib/auth-store";
import { studyMaterialApi, type StudyMaterial } from "@/lib/api/study-material";
import { LANDING_TRACK_TO_EXAM } from "@/lib/landing-study-materials";
import { useIsCompactLayout } from "@/hooks/use-mobile";

// ── Static per-exam content ──────────────────────────────────────────────────

const examTrackContent = {
  "iit-jee": {
    name: "IIT JEE", shortName: "JEE", examKey: LANDING_TRACK_TO_EXAM["iit-jee"],
    color: B, accent: IN, badge: "Engineering Track",
    title: "Everything for JEE in one page.",
    subtitle: "PYQs, chapter notes, mock tests, revision sheets and topic-wise practice arranged like a real exam prep hub.",
    stats: [
      { label: "PYQ Papers", value: "220+" },
      { label: "Quick Notes", value: "480+" },
      { label: "Mock Tests", value: "72" },
      { label: "Revision Time", value: "90 Days" },
    ],
    subjects: [
      { name: "Physics",     topics: "Mechanics, Modern Physics, Waves",  color: B },
      { name: "Chemistry",   topics: "Physical, Organic, Inorganic",      color: P },
      { name: "Mathematics", topics: "Calculus, Algebra, Coordinate",     color: IN },
    ],
    resources: [
      { title: "PYQ Bank",      desc: "Year-wise JEE Main + Advanced previous questions with difficulty tags.", icon: FileQuestion },
      { title: "Revision Notes",desc: "Short notes, formula sheets and concept maps for fast revision.",       icon: BookOpen },
      { title: "Mock Tests",    desc: "Full syllabus tests, chapter tests and rank predictor style analysis.", icon: Trophy },
      { title: "AI Study Plan", desc: "Weekly targets based on weak chapters, tests and revision backlog.",    icon: Brain },
    ],
    highlights: [
      "JEE Main 2025 Session-wise PYQs",
      "Advanced level subjective concept drills",
      "Formula book for Physics and Maths",
      "Daily DPPs and timed practice sets",
    ],
  },
  "neet-ug": {
    name: "NEET UG", shortName: "NEET", examKey: LANDING_TRACK_TO_EXAM["neet-ug"],
    color: "#EF4444", accent: T, badge: "Medical Track",
    title: "NEET prep — notes, PYQs and tests.",
    subtitle: "A clean preview of Biology-heavy preparation with NCERT-first notes, chapter tests, PYQ blocks and revision support.",
    stats: [
      { label: "PYQ Papers",    value: "180+" },
      { label: "NCERT Notes",   value: "520+" },
      { label: "Topic Tests",   value: "96" },
      { label: "Revision Cycles", value: "3x" },
    ],
    subjects: [
      { name: "Biology",   topics: "Botany, Zoology, NCERT line focus",     color: "#EF4444" },
      { name: "Physics",   topics: "Concepts + numericals + error log",      color: T },
      { name: "Chemistry", topics: "Physical, Organic, Inorganic",           color: P },
    ],
    resources: [
      { title: "PYQ Practice",  desc: "Topic-wise NEET previous year questions with NCERT mapping.",          icon: FileQuestion },
      { title: "NCERT Notes",   desc: "Line-by-line quick revision notes, diagrams and highlighted facts.",   icon: BookOpen },
      { title: "Test Series",   desc: "Part tests, full mocks and chapter-wise accuracy analytics.",          icon: Trophy },
      { title: "Smart Planner", desc: "Daily revision cycles with Biology-heavy scheduling and reminders.",   icon: Brain },
    ],
    highlights: [
      "NCERT line-based Biology notes",
      "Assertion-reason and statement practice",
      "Fast revision modules for inorganic chemistry",
      "Weak-topic retest plan after every mock",
    ],
  },
} as const;

// ── PDF Preview Modal ────────────────────────────────────────────────────────

function PdfPreviewModal({
  material,
  color,
  enrolled,
  onClose,
}: {
  material: StudyMaterial;
  color: string;
  enrolled: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState("");
  const previewUrl = studyMaterialApi.previewPublicUrl(material.id);

  const handleDownload = async () => {
    if (!isAuthenticated) { navigate("/register"); return; }
    if (!enrolled) { navigate("/register"); return; }
    setDownloading(true);
    setDlError("");
    try {
      const { url } = await studyMaterialApi.download(material.id);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${material.title}.pdf`;
      a.click();
    } catch (e: any) {
      setDlError(e?.response?.data?.message || "Could not get download link.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="relative flex min-h-0 w-full max-w-3xl max-h-[90dvh] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl sm:max-h-[min(90dvh,90vh)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0">
            <p className="truncate text-[16px] font-extrabold text-gray-900">{material.title}</p>
            <p className="mt-0.5 text-[12px] text-gray-400">
              {material.subject && `${material.subject} · `}
              Preview — first {material.previewPages} pages only
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* PDF iframe */}
        <div className="relative min-h-0 flex-1 overflow-hidden bg-gray-100" style={{ minHeight: "min(380px,45dvh)" }}>
          <iframe
            src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="h-full min-h-[min(380px,45dvh)] w-full border-0"
            title="PDF Preview"
          />

          {/* Blur gate at bottom when not enrolled */}
          {!enrolled && (
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white/95 to-transparent" />
          )}
        </div>

        {/* Gate banner */}
        {!enrolled && (
          <div className="border-t border-gray-100 bg-white px-6 py-5">
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
              <Lock className="h-4 w-4 flex-shrink-0 text-amber-600" />
              <p className="text-[13px] font-semibold text-amber-800">
                {isAuthenticated
                  ? "You're not enrolled in any course. Purchase a course to download the full PDF."
                  : "Create a free account to continue, then purchase a course to unlock full access."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[13px] font-bold text-white shadow"
                  style={{ background: `linear-gradient(135deg, ${color}, #6366f1)` }}
                >
                  Register Free <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-bold text-gray-700 hover:bg-gray-50"
              >
                Buy Course <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Download row (enrolled) */}
        {enrolled && (
          <div className="flex items-center justify-between gap-4 border-t border-gray-100 px-6 py-4">
            {dlError && (
              <div className="flex items-center gap-2 text-[12px] text-red-600">
                <AlertCircle className="h-4 w-4" /> {dlError}
              </div>
            )}
            <p className="flex-1 text-[12px] text-gray-400">
              Download link valid for 15 minutes after generation.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[13px] font-bold text-white shadow"
              style={{ background: `linear-gradient(135deg, ${color}, #6366f1)` }}
            >
              {downloading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Getting link…</>
                : <><Download className="h-4 w-4" /> Download Full PDF</>
              }
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Material Card ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  notes: "Notes", pyq: "PYQ", formula_sheet: "Formula Sheet", dpp: "DPP",
};
const TYPE_COLORS: Record<string, string> = {
  notes: B, pyq: "#EF4444", formula_sheet: "#F59E0B", dpp: P,
};

function MaterialCard({
  material, color, enrolled,
  onPreview,
}: {
  material: StudyMaterial;
  color: string;
  enrolled: boolean;
  onPreview: (m: StudyMaterial) => void;
}) {
  const tc = TYPE_COLORS[material.type] ?? color;
  const isCompact = useIsCompactLayout();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.4 }}
      whileHover={isCompact ? undefined : { y: -4, boxShadow: `0 20px 50px ${color}18` }}
      className="flex flex-col rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
          style={{ background: `${tc}14`, color: tc }}
        >
          {TYPE_LABELS[material.type] ?? material.type}
        </span>
        {!enrolled && <Lock className="h-4 w-4 flex-shrink-0 text-amber-400" />}
      </div>

      <p className="flex-1 text-[15px] font-extrabold leading-snug text-gray-900">{material.title}</p>
      {material.subject && (
        <p className="mt-1 text-[12px] font-semibold" style={{ color }}>{material.subject}</p>
      )}
      {material.chapter && (
        <p className="mt-0.5 text-[11px] text-gray-400">{material.chapter}</p>
      )}
      {material.description && (
        <p className="mt-2 text-[12px] leading-relaxed text-gray-500">{material.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-[11px] text-gray-400">
          {material.totalPages ? `${material.totalPages} pages` : ""}
          {material.fileSizeKb ? ` · ${Math.round(material.fileSizeKb / 1024 * 10) / 10} MB` : ""}
        </span>
        <button
          onClick={() => onPreview(material)}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all hover:opacity-80"
          style={{ background: `${color}14`, color }}
        >
          <Eye className="h-3.5 w-3.5" />
          {enrolled ? "View & Download" : `Preview (${material.previewPages}p)`}
        </button>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExamTrackDemoPage() {
  const { track = "iit-jee" } = useParams();
  const demo = examTrackContent[track as keyof typeof examTrackContent] ?? examTrackContent["iit-jee"];
  const { isAuthenticated } = useAuthStore();

  const [materials, setMaterials]       = useState<StudyMaterial[]>([]);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [enrolled, setEnrolled]         = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "notes" | "pyq" | "formula_sheet" | "dpp">("all");
  const [preview, setPreview]           = useState<StudyMaterial | null>(null);
  const materialsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const load = async () => {
      try {
        let hasAccess = false;
        if (isAuthenticated) {
          const s = await studyMaterialApi.accessStatus({ exam: demo.examKey });
          hasAccess = !!s.enrolled;
          if (!cancelled) setEnrolled(hasAccess);
        } else if (!cancelled) {
          setEnrolled(false);
        }

        const rows = hasAccess
          ? await studyMaterialApi.list({ exam: demo.examKey, limit: 200 })
          : await studyMaterialApi.listPublic({ exam: demo.examKey, limit: 200 });

        if (!cancelled) {
          setMaterials(rows);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setMaterials([]);
          setLoadError("Could not load the study materials list. Is the API running and reachable (see Vite proxy / VITE_API_BASE_URL)?");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [demo.examKey, isAuthenticated]);

  const filtered = activeFilter === "all"
    ? materials
    : materials.filter((m) => m.type === activeFilter);

  const FILTERS = [
    { key: "all",          label: "All" },
    { key: "notes",        label: "Notes" },
    { key: "pyq",          label: "PYQs" },
    { key: "formula_sheet",label: "Formula Sheets" },
    { key: "dpp",          label: "DPPs" },
  ] as const;

  return (
    <LandingLayout>
      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${demo.color}10 0%, #ffffff 38%, #f8fafc 100%)` }}
      >
        <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full blur-3xl" style={{ background: `${demo.color}26` }} />
        <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full blur-3xl" style={{ background: `${demo.accent}22` }} />

        <div className="landing-shell relative py-16 sm:py-20">
          <FadeUp className="mb-5"><SLabel color={demo.color}>{demo.badge}</SLabel></FadeUp>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <FadeUp delay={0.05}>
              <div className="mb-5 flex flex-wrap items-center gap-3 text-[12px] font-bold text-gray-600">
                <Link to="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900">
                  Home <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <span style={{ color: demo.color }}>{demo.name}</span>
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight text-gray-900 sm:text-5xl">
                {demo.title.split(" ").slice(0, -2).join(" ")}{" "}
                <span style={gText(demo.color, demo.accent)}>{demo.title.split(" ").slice(-2).join(" ")}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-gray-600">{demo.subtitle}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-[14px] font-bold text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${demo.color}, ${demo.accent})` }}
                >
                  Start Prep <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => materialsRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-[14px] font-bold text-gray-700"
                >
                  Study Materials <PlayCircle className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {demo.highlights.map((item) => (
                  <div key={item} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-gray-700 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5" style={{ color: demo.color }} /> {item}
                  </div>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-[0.22em] text-gray-400">Prep Hub</p>
                    <p className="mt-1 text-[22px] font-black text-gray-900">{demo.shortName}</p>
                  </div>
                  <div className="rounded-2xl px-3 py-2 text-[12px] font-black text-white" style={{ background: demo.color }}>
                    {isAuthenticated ? (enrolled ? "Enrolled" : "Register to buy") : "Sign up free"}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {demo.stats.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                      <p className="text-[12px] font-semibold text-gray-400">{item.label}</p>
                      <p className="mt-1 text-[26px] font-black text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-500">
                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                    {enrolled
                      ? "Full access — download all study materials"
                      : "Preview 2 pages free · Buy course to download"}
                  </div>
                  {!enrolled && (
                    <Link
                      to="/register"
                      className="mt-3 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${demo.color}, ${demo.accent})` }}
                    >
                      Get Full Access <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── RESOURCE TYPE CARDS ── */}
      <section className="bg-white py-16">
        <div className="landing-shell">
          <FadeUp className="mb-10 text-center">
            <SLabel color={demo.color}>Resources</SLabel>
            <h2 className="mt-4 text-3xl font-black text-gray-900 sm:text-4xl">
              Everything for <span style={gText(demo.color, demo.accent)}>{demo.name}</span>
            </h2>
          </FadeUp>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {demo.resources.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.title}
                  initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.06 }}
                  className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `${demo.color}14` }}>
                    <Icon className="h-6 w-6" style={{ color: demo.color }} />
                  </div>
                  <h3 className="text-[18px] font-extrabold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-600">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── LIVE STUDY MATERIALS from API ── */}
      <section ref={materialsRef} className="bg-[#f8fafc] py-16" id="materials">
        <div className="landing-shell">
          <FadeUp className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SLabel color={demo.color}>Study Materials</SLabel>
                <h2 className="mt-3 text-3xl font-black text-gray-900">
                  Notes, PYQs &amp; Sheets for{" "}
                  <span style={gText(demo.color, demo.accent)}>{demo.name}</span>
                </h2>
                {!enrolled && (
                  <p className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-amber-700">
                    <Lock className="h-3.5 w-3.5" />
                    Preview first {2} pages free — buy a course to download full PDFs
                  </p>
                )}
              </div>
              {isAuthenticated && enrolled && (
                <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-[12px] font-bold text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Enrolled — full access
                </span>
              )}
            </div>
          </FadeUp>

          {/* Filter tabs */}
          <FadeUp delay={0.05} className="mb-6">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`rounded-xl px-4 py-2 text-[12px] font-bold transition-all ${
                    activeFilter === f.key ? "text-white shadow-md" : "border border-gray-200 bg-white text-gray-500 hover:text-gray-800"
                  }`}
                  style={activeFilter === f.key ? { background: demo.color } : {}}
                >
                  {f.label}
                  {f.key !== "all" && (
                    <span className="ml-1.5 opacity-60">
                      ({materials.filter((m) => m.type === f.key).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </FadeUp>

          {/* Cards */}
          {loading ? (
            <div className="flex h-48 items-center justify-center gap-3 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-[14px] font-semibold">Loading materials…</span>
            </div>
          ) : loadError ? (
            <div className="rounded-[28px] border border-amber-200 bg-amber-50/80 py-10 px-4 text-center">
              <p className="text-[15px] font-bold text-amber-900">{loadError}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-gray-200 bg-white py-16 text-center">
              <div className="mb-3 text-4xl">📂</div>
              <p className="text-[16px] font-bold text-gray-700">
                {materials.length === 0
                  ? `No study materials uploaded yet for ${demo.name}.`
                  : `No ${activeFilter} materials yet.`}
              </p>
              <p className="mt-2 text-[13px] text-gray-400">
                Check back soon — materials are being added, or your institute can publish PDFs from Admin → Study Materials
                (exam: JEE/NEET, active, non-suspended tenant).
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filtered.map((m) => (
                  <MaterialCard
                    key={m.id}
                    material={m}
                    color={demo.color}
                    enrolled={enrolled}
                    onPreview={setPreview}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* ── BOTTOM CTA + SUBJECTS ── */}
      <section className="bg-white py-16">
        <div className="landing-shell">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <FadeUp>
              <div className="rounded-[30px] p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]" style={{ background: `linear-gradient(135deg, ${demo.color}, ${demo.accent})` }}>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]">
                  <Sparkles className="h-3.5 w-3.5" /> Access Policy
                </p>
                <h3 className="mt-5 text-3xl font-black leading-tight">One place for prep, revision and testing.</h3>
                <p className="mt-4 text-[15px] leading-relaxed text-white/85">
                  All study materials are gated. Register free to preview 2 pages of any PDF. Purchase a course to unlock full downloads.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Free: Preview first 2 pages of every PDF",
                    "Registered: Explore all material listings",
                    "Enrolled: Download full PDFs (15-min link)",
                    "AI study plan + mock tests included",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <span className="text-[14px] font-semibold">{item}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/register"
                  className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[14px] font-black"
                  style={{ color: demo.color }}
                >
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </FadeUp>

            <FadeUp delay={0.08}>
              <div className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[18px] font-black text-gray-900">Core Subjects</p>
                    <p className="text-[13px] text-gray-500">Structured by subject and topic clusters</p>
                  </div>
                  <Target className="h-5 w-5" style={{ color: demo.color }} />
                </div>
                <div className="space-y-4">
                  {demo.subjects.map((subject) => (
                    <div key={subject.name} className="rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[16px] font-extrabold text-gray-900">{subject.name}</p>
                          <p className="mt-1 text-[13px] text-gray-500">{subject.topics}</p>
                        </div>
                        <span className="rounded-full px-3 py-1 text-[11px] font-black" style={{ background: `${subject.color}12`, color: subject.color }}>
                          Ready
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <Calendar className="mb-2 h-4 w-4" style={{ color: demo.color }} />
                    <p className="text-[13px] font-bold text-gray-900">Daily targets</p>
                    <p className="mt-1 text-[12px] text-gray-500">Morning concept + evening test plan</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <Timer className="mb-2 h-4 w-4" style={{ color: demo.color }} />
                    <p className="text-[13px] font-bold text-gray-900">Timed practice</p>
                    <p className="mt-1 text-[12px] text-gray-500">Speed, accuracy and error analysis</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <Trophy className="mb-2 h-4 w-4" style={{ color: demo.color }} />
                    <p className="text-[13px] font-bold text-gray-900">Rank mindset</p>
                    <p className="mt-1 text-[12px] text-gray-500">Compete with consistent weekly mocks</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── PDF PREVIEW MODAL ── */}
      <AnimatePresence>
        {preview && (
          <PdfPreviewModal
            material={preview}
            color={demo.color}
            enrolled={enrolled}
            onClose={() => setPreview(null)}
          />
        )}
      </AnimatePresence>
    </LandingLayout>
  );
}
