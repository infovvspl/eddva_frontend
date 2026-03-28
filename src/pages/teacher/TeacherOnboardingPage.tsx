import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";
import { useCompleteTeacherOnboarding, useUploadAvatar } from "@/hooks/use-auth";
import { getMe } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Camera, Plus, X, ChevronRight, ChevronLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUALIFICATIONS = ["B.Tech", "M.Sc", "B.Ed", "Ph.D", "Other"];

const SUBJECT_SUGGESTIONS = [
  "Physics", "Chemistry", "Mathematics", "Biology",
  "English", "Hindi", "History", "Geography",
  "Economics", "Computer Science",
];

const CLASS_OPTIONS = ["8", "9", "10", "11", "12", "Dropper"];

const TEACHING_MODES = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Hybrid" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const STEPS = ["Basic Info", "Professional Info", "About"];

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-col items-center flex-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
                i < step
                  ? "bg-primary border-primary text-primary-foreground"
                  : i === step
                  ? "border-primary text-primary bg-primary/10"
                  : "border-muted-foreground/30 text-muted-foreground/50",
              )}
            >
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-xs mt-1 font-medium",
                i === step ? "text-primary" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      {/* Connector bars */}
      <div className="flex mt-0 px-4">
        {STEPS.slice(0, -1).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-1 rounded-full mx-1 transition-colors",
              i < step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag input
// ---------------------------------------------------------------------------

function TagInput({
  tags,
  onChange,
  suggestions,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

  const filteredSuggestions =
    suggestions?.filter(
      (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s),
    ) ?? [];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-destructive transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
            }
          }}
          placeholder={placeholder || "Type and press Enter…"}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={() => addTag(input)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {input && filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {filteredSuggestions.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="text-xs px-2 py-1 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

export default function TeacherOnboardingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const completeOnboarding = useCompleteTeacherOnboarding();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Form state
  const [fullName, setFullName] = useState(user?.name || "");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.teacherProfile?.profilePhotoUrl || null,
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user?.teacherProfile?.profilePhotoUrl || "",
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Step 2
  const [qualification, setQualification] = useState("");
  const [subjectExpertise, setSubjectExpertise] = useState<string[]>([]);
  const [classesTeach, setClassesTeach] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState<string>("");
  const [teachingMode, setTeachingMode] = useState("");

  // Step 3
  const [bio, setBio] = useState("");
  const [previousInstitute, setPreviousInstitute] = useState("");

  const BIO_MAX = 300;

  // ── Avatar upload ──────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    try {
      const result = await uploadAvatar.mutateAsync(file);
      setAvatarUrl(result.url);
    } catch {
      toast({ title: "Upload failed", description: "Could not upload avatar. You can continue anyway.", variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    try {
      const result = await completeOnboarding.mutateAsync({
        fullName: fullName || undefined,
        qualification: qualification || undefined,
        subjectExpertise: subjectExpertise.length ? subjectExpertise : undefined,
        classesTeach: classesTeach.length ? classesTeach : undefined,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
        bio: bio || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        profilePhotoUrl: avatarUrl || undefined,
        teachingMode: teachingMode || undefined,
        previousInstitute: previousInstitute || undefined,
        city: city || undefined,
        state: state || undefined,
      });
      // Refresh store from /me so updated name + teacherProfile are reflected
      const { setUser } = useAuthStore.getState();
      try {
        const meData = await getMe();
        const p = meData.user;
        setUser({
          id: p.id,
          name: (p as any).fullName || p.name || "",
          phone: (p as any).phoneNumber || (p as any).phone || "",
          email: p.email,
          role: p.role as any,
          avatar: p.avatar,
          tenantId: p.tenantId,
          tenantName: p.tenant?.name || (p as any).tenantName || "",
          isFirstLogin: false,
          teacherProfile: (meData as any).teacherProfile ?? { id: "", userId: p.id ?? "", tenantId: p.tenantId || "", onboardingComplete: true },
        });
      } catch {
        // fallback: just mark profile complete so redirect loop stops
        if (user) setUser({ ...user, teacherProfile: { id: "", userId: user.id, tenantId: user.tenantId || "", onboardingComplete: true } });
      }
      toast({ title: "Onboarding complete!", description: "Welcome aboard. Your profile is all set." });
      navigate("/teacher");
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleSkip = () => {
    // Mark teacherProfile as non-null in the store so DashboardLayout
    // doesn't redirect back to onboarding on every page load.
    const { setUser } = useAuthStore.getState();
    if (user) {
      setUser({ ...user, teacherProfile: { id: "", userId: user.id, tenantId: user.tenantId || "", onboardingComplete: false } });
    }
    navigate("/teacher");
  };

  // ── Render steps ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Welcome to EDVA</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Let's set up your teacher profile — it only takes a minute.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <ProgressBar step={step} />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {/* ── Step 1: Basic Info ─────────────────────────────────────── */}
              {step === 0 && (
                <div className="space-y-5">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/40 hover:border-primary transition-colors overflow-hidden flex items-center justify-center bg-muted group"
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {avatarPreview ? "Click to change photo" : "Upload profile photo"}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <Label>Gender</Label>
                    <div className="flex gap-3 flex-wrap">
                      {GENDER_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors",
                            gender === opt.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-muted-foreground",
                          )}
                        >
                          <input
                            type="radio"
                            name="gender"
                            value={opt.value}
                            checked={gender === opt.value}
                            onChange={() => setGender(opt.value)}
                            className="sr-only"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>

                  {/* City & State */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>City</Label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Mumbai"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>State</Label>
                      <Input
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. Maharashtra"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Professional Info ──────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-5">
                  {/* Qualification */}
                  <div className="space-y-1.5">
                    <Label>Highest Qualification</Label>
                    <div className="flex flex-wrap gap-2">
                      {QUALIFICATIONS.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setQualification(q)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                            qualification === q
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-muted-foreground",
                          )}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject Expertise */}
                  <div className="space-y-1.5">
                    <Label>Subject Expertise</Label>
                    <TagInput
                      tags={subjectExpertise}
                      onChange={setSubjectExpertise}
                      suggestions={SUBJECT_SUGGESTIONS}
                      placeholder="Type subject and press Enter…"
                    />
                  </div>

                  {/* Classes */}
                  <div className="space-y-1.5">
                    <Label>Classes You Teach</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {CLASS_OPTIONS.map((cls) => (
                        <label
                          key={cls}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors",
                            classesTeach.includes(cls)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-muted-foreground",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={classesTeach.includes(cls)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setClassesTeach([...classesTeach, cls]);
                              } else {
                                setClassesTeach(classesTeach.filter((c) => c !== cls));
                              }
                            }}
                            className="sr-only"
                          />
                          Class {cls}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Years of Experience */}
                  <div className="space-y-1.5">
                    <Label>Years of Experience</Label>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </div>

                  {/* Teaching Mode */}
                  <div className="space-y-1.5">
                    <Label>Teaching Mode</Label>
                    <div className="flex gap-3">
                      {TEACHING_MODES.map((m) => (
                        <label
                          key={m.value}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm flex-1 justify-center transition-colors",
                            teachingMode === m.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-muted-foreground",
                          )}
                        >
                          <input
                            type="radio"
                            name="teachingMode"
                            value={m.value}
                            checked={teachingMode === m.value}
                            onChange={() => setTeachingMode(m.value)}
                            className="sr-only"
                          />
                          {m.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: About ──────────────────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* Bio */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>Bio / About</Label>
                      <span
                        className={cn(
                          "text-xs",
                          bio.length > BIO_MAX ? "text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {bio.length}/{BIO_MAX}
                      </span>
                    </div>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                      placeholder="Tell students a bit about yourself — your teaching style, achievements, or passion for the subject…"
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  {/* Previous Institute */}
                  <div className="space-y-1.5">
                    <Label>Previous Institute / Organisation</Label>
                    <Input
                      value={previousInstitute}
                      onChange={(e) => setPreviousInstitute(e.target.value)}
                      placeholder="e.g. Allen Career Institute, Kota"
                    />
                  </div>

                  {/* Summary card */}
                  <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2 text-sm">
                    <p className="font-semibold text-foreground mb-2">Profile Summary</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                      <span>Name:</span>
                      <span className="text-foreground font-medium truncate">{fullName || "—"}</span>
                      <span>Qualification:</span>
                      <span className="text-foreground font-medium">{qualification || "—"}</span>
                      <span>Experience:</span>
                      <span className="text-foreground font-medium">
                        {yearsOfExperience ? `${yearsOfExperience} years` : "—"}
                      </span>
                      <span>Subjects:</span>
                      <span className="text-foreground font-medium">
                        {subjectExpertise.length ? subjectExpertise.join(", ") : "—"}
                      </span>
                      <span>Teaching Mode:</span>
                      <span className="text-foreground font-medium capitalize">{teachingMode || "—"}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            <div>
              {step > 0 ? (
                <Button variant="ghost" onClick={goPrev}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip for now
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {step < STEPS.length - 1 ? (
                <Button onClick={goNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip for now
                  </button>
                  <Button
                    onClick={handleSubmit}
                    disabled={completeOnboarding.isPending}
                  >
                    {completeOnboarding.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Complete Setup
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can update your profile anytime from your dashboard.
        </p>
      </div>
    </div>
  );
}
