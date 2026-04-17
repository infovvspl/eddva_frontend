import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";
import { useInstituteOnboarding, useSaveInstituteOnboarding, useUploadInstituteOrgImage } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Building2, BookOpen, Monitor, Users, Zap,
  ChevronRight, ChevronLeft, CheckCircle2, Loader2,
  Upload, Plus, X, MapPin, Tag,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────

const COURSE_SUGGESTIONS = [
  "JEE Main", "JEE Advanced", "NEET UG", "NEET PG",
  "CBSE Class 10", "CBSE Class 12", "ICSE", "ISC",
  "UPSC", "SSC", "GATE", "CA Foundation",
];

const TEACHING_MODE_OPTIONS = [
  { key: "online",  label: "Online",        desc: "100% internet-based delivery",       icon: Monitor },
  { key: "offline", label: "Offline",       desc: "In-person classroom sessions",        icon: Users },
  { key: "hybrid",  label: "Hybrid",        desc: "Mix of online and in-person",         icon: Zap },
  { key: "live",    label: "Live Classes",  desc: "Real-time interactive sessions",      icon: Monitor },
  { key: "recorded","label": "Recorded",    desc: "Pre-recorded on-demand content",      icon: BookOpen },
  { key: "both",    label: "Live + Recorded", desc: "Best of both worlds",               icon: Zap },
] as const;

const STEPS = [
  { label: "Institute", icon: Building2 },
  { label: "Courses",   icon: BookOpen },
  { label: "Mode",      icon: Monitor },
];

// ── Stepper ────────────────────────────────────────────────────────────────────

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < step;
        const active = i === step;
        return (
          <div key={s.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  backgroundColor: done || active ? "#6366f1" : "#f1f5f9",
                  scale: active ? 1.1 : 1,
                }}
                transition={{ duration: 0.25 }}
                className="w-10 h-10 rounded-2xl border-2 border-transparent flex items-center justify-center shadow-sm"
                style={{ borderColor: done || active ? "#6366f1" : "#e2e8f0" }}
              >
                {done
                  ? <CheckCircle2 className="w-5 h-5 text-white" />
                  : <Icon className={cn("w-4 h-4", active ? "text-white" : "text-slate-400")} />
                }
              </motion.div>
              <span className={cn("text-[11px] font-semibold", active ? "text-indigo-600" : done ? "text-indigo-400" : "text-slate-400")}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <motion.div
                animate={{ backgroundColor: i < step ? "#6366f1" : "#e2e8f0" }}
                transition={{ duration: 0.4 }}
                className="w-16 h-0.5 mb-5 mx-2"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tag input ──────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange, suggestions, placeholder }: {
  tags: string[];
  onChange: (t: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const add = (v: string) => {
    const t = v.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  };
  const filtered = suggestions?.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  ) ?? [];

  return (
    <div className="space-y-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">
              <Tag className="w-3 h-3" />{tag}
              <button onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-red-500 transition-colors ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(input); } }}
          placeholder={placeholder ?? "Type and press Enter…"}
          className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        <button type="button" onClick={() => add(input)}
          className="px-4 h-10 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      {input && filtered.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filtered.slice(0, 8).map(s => (
            <button key={s} type="button" onClick={() => add(s)}
              className="text-xs px-2.5 py-1 rounded-full border border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Slide variants ─────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d: number) => ({ x: d < 0 ? 60 : -60, opacity: 0 }),
};

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminOnboardingPage() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();

  const { data: prefill, isLoading: prefillLoading } = useInstituteOnboarding();
  const save      = useSaveInstituteOnboarding();
  const uploadLogo = useUploadInstituteOrgImage();
  const fileRef   = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [dir,  setDir]  = useState(1);

  // Step 1
  const [name,        setName]        = useState("");
  const [city,        setCity]        = useState("");
  const [state,       setState]       = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl,     setLogoUrl]     = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);

  // Step 2
  const [coursesOffered, setCoursesOffered] = useState<string[]>([]);

  // Step 3
  const [teachingMode, setTeachingMode] = useState("hybrid");

  // Pre-fill from GET /institute/settings/onboarding
  useEffect(() => {
    if (!prefill) return;
    if (prefill.name)           setName(prefill.name);
    if (prefill.city)           setCity(prefill.city);
    if (prefill.state)          setState(prefill.state);
    if (prefill.logoUrl)        { setLogoUrl(prefill.logoUrl); setLogoPreview(prefill.logoUrl); }
    if (prefill.coursesOffered?.length) setCoursesOffered(prefill.coursesOffered);
    if (prefill.teachingMode)   setTeachingMode(prefill.teachingMode);
  }, [prefill]);

  // Logo upload
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const res = await uploadLogo.mutateAsync(file);
      setLogoUrl(res.url);
    } catch {
      toast.error("Logo upload failed — you can update it later from Settings.");
    } finally {
      setUploading(false);
    }
  };

  const clearUser = (onboardingRequired: boolean) => {
    if (user) {
      useAuthStore.getState().setUser({ ...user, onboardingRequired });
    }
  };

  // Save current step data to backend
  const saveStep = async (payload: Parameters<typeof save.mutateAsync>[0]) => {
    await save.mutateAsync(payload);
  };

  const next = async () => {
    try {
      if (step === 0) {
        await saveStep({ name: name || undefined, city: city || undefined, state: state || undefined, logoUrl: logoUrl || undefined });
      } else if (step === 1) {
        await saveStep({ coursesOffered });
      }
      setDir(1);
      setStep(s => s + 1);
    } catch {
      toast.error("Could not save — please try again.");
    }
  };

  const prev = () => { setDir(-1); setStep(s => s - 1); };

  const handleComplete = async () => {
    try {
      await saveStep({ name: name || undefined, city: city || undefined, state: state || undefined,
        logoUrl: logoUrl || undefined, coursesOffered, teachingMode });
      clearUser(false);
      toast.success("Institute profile complete! Welcome to EDDVA.");
      navigate("/admin");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleSkip = async () => {
    // POST with whatever has been filled so far — backend always marks onboardingComplete = true
    try {
      await save.mutateAsync({ name: name || undefined, city: city || undefined, state: state || undefined,
        logoUrl: logoUrl || undefined, coursesOffered: coursesOffered.length ? coursesOffered : undefined,
        teachingMode: teachingMode || undefined });
    } catch { /* skip anyway */ }
    clearUser(false);
    navigate("/admin");
  };

  const isPending = save.isPending;

  if (prefillLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-80 xl:w-96 shrink-0 bg-gradient-to-b from-indigo-600 to-indigo-800 p-10 text-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-white/3" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">EDDVA Admin</span>
          </div>
          <h2 className="text-3xl font-extrabold leading-snug mb-4">
            Set up your institute in 3 quick steps
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed">
            Help students find your institute. You can update everything later from Settings.
          </p>
        </div>

        <div className="relative z-10 space-y-5">
          {[
            { icon: Building2, text: "Institute identity & location" },
            { icon: BookOpen,  text: "Courses & exams you offer" },
            { icon: Monitor,   text: "How you deliver teaching" },
          ].map((item, i) => {
            const Icon = item.icon;
            const done   = i < step;
            const active = i === step;
            return (
              <div key={i} className={cn("flex items-center gap-3 transition-all duration-300", !done && !active && "opacity-40")}>
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  done ? "bg-white/30" : active ? "bg-white/20 ring-2 ring-white/40" : "bg-white/10")}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Set up your institute</h1>
            <p className="text-slate-400 text-sm mt-1">Step {step + 1} of {STEPS.length}</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
            <Stepper step={step} />

            <AnimatePresence mode="wait" custom={dir}>
              <motion.div key={step} custom={dir} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}>

                {/* ── Step 1: Institute basics ── */}
                {step === 0 && (
                  <div className="space-y-6">
                    {/* Logo upload */}
                    <div className="flex items-center gap-5">
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 flex items-center justify-center overflow-hidden transition-colors group shrink-0">
                        {logoPreview
                          ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                          : <Upload className="w-6 h-6 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        }
                        {uploading && (
                          <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                          </div>
                        )}
                      </button>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Institute Logo</p>
                        <p className="text-xs text-slate-400 mt-0.5">Shown on all your courses and student dashboards.</p>
                        <button onClick={() => fileRef.current?.click()} type="button"
                          className="mt-2 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
                          {logoPreview ? "Change logo" : "Upload logo"}
                        </button>
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </div>

                    <Field label="Institute Name" hint="This is the name students will see on your courses.">
                      <input value={name} onChange={e => setName(e.target.value)}
                        placeholder="e.g. Bright Future Academy"
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="City">
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai"
                            className="w-full h-11 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                        </div>
                      </Field>
                      <Field label="State">
                        <input value={state} onChange={e => setState(e.target.value)} placeholder="Maharashtra"
                          className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                      </Field>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Courses ── */}
                {step === 1 && (
                  <div className="space-y-6">
                    <Field
                      label="Courses Offered"
                      hint="Add the exams or programmes your institute prepares students for. Press Enter or click Add.">
                      <TagInput
                        tags={coursesOffered}
                        onChange={setCoursesOffered}
                        suggestions={COURSE_SUGGESTIONS}
                        placeholder="e.g. JEE Main, NEET UG…"
                      />
                    </Field>

                    {coursesOffered.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center">
                        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No courses added yet. Type above or pick from suggestions.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Step 3: Teaching mode ── */}
                {step === 2 && (
                  <div className="space-y-4">
                    <Field label="Teaching Mode" hint="How does your institute primarily deliver content to students?">
                      <div className="grid grid-cols-2 gap-3">
                        {TEACHING_MODE_OPTIONS.map(opt => {
                          const Icon = opt.icon;
                          const active = teachingMode === opt.key;
                          return (
                            <button key={opt.key} type="button" onClick={() => setTeachingMode(opt.key)}
                              className={cn(
                                "flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all",
                                active ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300"
                              )}>
                              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                                active ? "bg-indigo-100" : "bg-slate-100")}>
                                <Icon className={cn("w-4 h-4", active ? "text-indigo-600" : "text-slate-400")} />
                              </div>
                              <div className="min-w-0">
                                <p className={cn("text-sm font-semibold leading-tight", active ? "text-indigo-700" : "text-slate-700")}>{opt.label}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</p>
                              </div>
                              {active && <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 ml-auto mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </Field>

                    {/* Summary card */}
                    <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 space-y-2 mt-2">
                      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-3">Profile Summary</p>
                      {[
                        ["Institute", name || "—"],
                        ["Location", [city, state].filter(Boolean).join(", ") || "—"],
                        ["Courses", coursesOffered.length ? `${coursesOffered.length} course${coursesOffered.length > 1 ? "s" : ""}` : "—"],
                        ["Teaching Mode", teachingMode || "—"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">{k}</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[180px]">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Footer nav */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              <div>
                {step > 0
                  ? <button onClick={prev} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  : <button onClick={handleSkip} className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">
                      Skip for now
                    </button>
                }
              </div>

              <div className="flex items-center gap-3">
                {step < STEPS.length - 1 ? (
                  <button onClick={next} disabled={isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-indigo-200">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button onClick={handleSkip} className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">
                      Skip
                    </button>
                    <button onClick={handleComplete} disabled={isPending}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-indigo-200">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {isPending ? "Saving…" : "Complete Setup"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            Everything can be updated anytime from{" "}
            <span className="font-semibold text-slate-500">Settings → Profile</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
