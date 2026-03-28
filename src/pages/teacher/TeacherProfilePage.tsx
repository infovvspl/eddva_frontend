import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";
import { useCompleteTeacherOnboarding, useUploadAvatar } from "@/hooks/use-auth";
import { getMe } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Camera, Pencil, X, Plus, Check, Loader2,
  GraduationCap, BookOpen, Users, MapPin,
  Briefcase, Zap, Clock, Building2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

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
const BIO_MAX = 300;

// ─── Small reusable components ────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, action }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4.5 h-4.5 text-primary" />
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-40 shrink-0">{label}</span>
      <span className="text-sm text-foreground font-medium">{value || <span className="text-muted-foreground italic">Not set</span>}</span>
    </div>
  );
}

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
  const filtered = suggestions?.filter(s =>
    s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  ) ?? [];
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))}>
              <X className="w-3 h-3 hover:text-destructive" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(input); } }}
          placeholder={placeholder || "Type and press Enter…"} className="flex-1 h-9 text-sm" />
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => add(input)}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
      {input && filtered.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filtered.slice(0, 6).map(s => (
            <button key={s} type="button" onClick={() => add(s)}
              className="text-xs px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherProfilePage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const completeOnboarding = useCompleteTeacherOnboarding();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tp = user?.teacherProfile as any;

  // Edit section state: null = view mode, "personal"|"professional"|"about" = edit
  const [editing, setEditing] = useState<"personal" | "professional" | "about" | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Personal fields
  const [fullName, setFullName] = useState(user?.name || "");
  const [gender, setGender] = useState(tp?.gender || "");
  const [dateOfBirth, setDateOfBirth] = useState(tp?.dateOfBirth || "");
  const [city, setCity] = useState(tp?.city || "");
  const [state, setState] = useState(tp?.state || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(tp?.profilePhotoUrl || user?.avatar || null);
  const [avatarUrl, setAvatarUrl] = useState<string>(tp?.profilePhotoUrl || user?.avatar || "");

  // Professional fields
  const [qualification, setQualification] = useState(tp?.qualification || "");
  const [subjectExpertise, setSubjectExpertise] = useState<string[]>(tp?.subjectExpertise || []);
  const [classesTeach, setClassesTeach] = useState<string[]>(tp?.classesTeach || []);
  const [yearsOfExperience, setYearsOfExperience] = useState(String(tp?.yearsOfExperience || ""));
  const [teachingMode, setTeachingMode] = useState(tp?.teachingMode || "");

  // About fields
  const [bio, setBio] = useState(tp?.bio || "");
  const [previousInstitute, setPreviousInstitute] = useState(tp?.previousInstitute || "");

  // ── Avatar upload ────────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setIsUploadingAvatar(true);
    try {
      const result = await uploadAvatar.mutateAsync(file);
      setAvatarUrl(result.url);
      // Immediately save avatar
      await completeOnboarding.mutateAsync({ profilePhotoUrl: result.url });
      await refreshStore();
      toast({ title: "Photo updated!" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Save section ─────────────────────────────────────────────────────────────

  const refreshStore = async () => {
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
        teacherProfile: (meData as any).teacherProfile ?? null,
      });
    } catch {
      // silent
    }
  };

  const save = async (section: "personal" | "professional" | "about") => {
    setIsSaving(true);
    try {
      const payload: Record<string, any> = {};
      if (section === "personal") {
        payload.fullName = fullName || undefined;
        payload.gender = gender || undefined;
        payload.dateOfBirth = dateOfBirth || undefined;
        payload.city = city || undefined;
        payload.state = state || undefined;
        payload.profilePhotoUrl = avatarUrl || undefined;
      } else if (section === "professional") {
        payload.qualification = qualification || undefined;
        payload.subjectExpertise = subjectExpertise.length ? subjectExpertise : undefined;
        payload.classesTeach = classesTeach.length ? classesTeach : undefined;
        payload.yearsOfExperience = yearsOfExperience ? Number(yearsOfExperience) : undefined;
        payload.teachingMode = teachingMode || undefined;
      } else {
        payload.bio = bio || undefined;
        payload.previousInstitute = previousInstitute || undefined;
      }
      await completeOnboarding.mutateAsync(payload);
      await refreshStore();
      setEditing(null);
      toast({ title: "Profile updated!" });
    } catch {
      toast({ title: "Save failed. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const cancel = (section: "personal" | "professional" | "about") => {
    // Reset to current store values
    if (section === "personal") {
      setFullName(user?.name || "");
      setGender(tp?.gender || "");
      setDateOfBirth(tp?.dateOfBirth || "");
      setCity(tp?.city || "");
      setState(tp?.state || "");
    } else if (section === "professional") {
      setQualification(tp?.qualification || "");
      setSubjectExpertise(tp?.subjectExpertise || []);
      setClassesTeach(tp?.classesTeach || []);
      setYearsOfExperience(String(tp?.yearsOfExperience || ""));
      setTeachingMode(tp?.teachingMode || "");
    } else {
      setBio(tp?.bio || "");
      setPreviousInstitute(tp?.previousInstitute || "");
    }
    setEditing(null);
  };

  const EditButton = ({ section }: { section: "personal" | "professional" | "about" }) =>
    editing === section ? null : (
      <Button variant="ghost" size="sm" onClick={() => setEditing(section)}
        className="h-7 gap-1 text-xs text-muted-foreground hover:text-primary">
        <Pencil className="w-3.5 h-3.5" /> Edit
      </Button>
    );

  const SaveCancelBar = ({ section }: { section: "personal" | "professional" | "about" }) => (
    <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
      <Button size="sm" onClick={() => save(section)} disabled={isSaving} className="gap-1.5">
        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        Save changes
      </Button>
      <Button variant="ghost" size="sm" onClick={() => cancel(section)} disabled={isSaving}>
        Cancel
      </Button>
    </div>
  );

  // ── Derived display values ────────────────────────────────────────────────────

  const initials = (user?.name || "T").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const completionFields = [
    user?.name, tp?.qualification, tp?.subjectExpertise?.length,
    tp?.bio, tp?.city, tp?.yearsOfExperience,
  ];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl mx-auto">

      {/* ── Profile Header ─────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl border-4 border-card overflow-hidden bg-primary/10 flex items-center justify-center shadow-md">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary">{initials}</span>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Completion badge */}
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Profile completion</p>
              <div className="flex items-center gap-2">
                <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionPct}%` }} />
                </div>
                <span className="text-xs font-semibold text-primary">{completionPct}%</span>
              </div>
            </div>
          </div>

          <h1 className="text-xl font-bold text-foreground">{user?.name || "Teacher"}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">Teacher</span>
            {tp?.teachingMode && (
              <span className="text-xs font-medium bg-secondary text-foreground px-2.5 py-1 rounded-full capitalize">
                {tp.teachingMode}
              </span>
            )}
            {tp?.yearsOfExperience && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {tp.yearsOfExperience} yrs experience
              </span>
            )}
            {(tp?.city || tp?.state) && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {[tp?.city, tp?.state].filter(Boolean).join(", ")}
              </span>
            )}
          </div>

          {tp?.bio && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{tp.bio}</p>
          )}

          {tp?.subjectExpertise?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tp.subjectExpertise.map((s: string) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-foreground font-medium">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Personal Info ───────────────────────────────────────────────────── */}
      <SectionCard title="Personal Information" icon={GraduationCap} action={<EditButton section="personal" />}>
        {editing === "personal" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <div className="flex flex-wrap gap-2">
                {[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "prefer_not_to_say", label: "Prefer not to say" }].map(opt => (
                  <label key={opt.value} className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors",
                    gender === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"
                  )}>
                    <input type="radio" name="gender" value={opt.value} checked={gender === opt.value}
                      onChange={() => setGender(opt.value)} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai" />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input value={state} onChange={e => setState(e.target.value)} placeholder="e.g. Maharashtra" />
              </div>
            </div>
            <SaveCancelBar section="personal" />
          </div>
        ) : (
          <>
            <InfoRow label="Full Name" value={user?.name} />
            <InfoRow label="Email" value={user?.email} />
            <InfoRow label="Phone" value={user?.phone} />
            <InfoRow label="Gender" value={tp?.gender?.replace(/_/g, " ")} />
            <InfoRow label="Date of Birth" value={tp?.dateOfBirth} />
            <InfoRow label="City" value={tp?.city} />
            <InfoRow label="State" value={tp?.state} />
          </>
        )}
      </SectionCard>

      {/* ── Professional Info ───────────────────────────────────────────────── */}
      <SectionCard title="Professional Information" icon={BookOpen} action={<EditButton section="professional" />}>
        {editing === "professional" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Highest Qualification</Label>
              <div className="flex flex-wrap gap-2">
                {QUALIFICATIONS.map(q => (
                  <button key={q} type="button" onClick={() => setQualification(q)}
                    className={cn("px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                      qualification === q ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"
                    )}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subject Expertise</Label>
              <TagInput tags={subjectExpertise} onChange={setSubjectExpertise}
                suggestions={SUBJECT_SUGGESTIONS} placeholder="Type subject and press Enter…" />
            </div>
            <div className="space-y-1.5">
              <Label>Classes You Teach</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {CLASS_OPTIONS.map(cls => (
                  <label key={cls} className={cn(
                    "flex items-center justify-center px-2 py-2 rounded-lg border cursor-pointer text-sm transition-colors",
                    classesTeach.includes(cls) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"
                  )}>
                    <input type="checkbox" checked={classesTeach.includes(cls)} className="sr-only"
                      onChange={e => setClassesTeach(e.target.checked ? [...classesTeach, cls] : classesTeach.filter(c => c !== cls))} />
                    {cls}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Years of Experience</Label>
                <Input type="number" min={0} max={50} value={yearsOfExperience}
                  onChange={e => setYearsOfExperience(e.target.value)} placeholder="e.g. 5" />
              </div>
              <div className="space-y-1.5">
                <Label>Teaching Mode</Label>
                <div className="flex gap-2">
                  {TEACHING_MODES.map(m => (
                    <label key={m.value} className={cn(
                      "flex-1 flex items-center justify-center px-2 py-2 rounded-lg border cursor-pointer text-sm transition-colors",
                      teachingMode === m.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"
                    )}>
                      <input type="radio" name="teachingMode" value={m.value} checked={teachingMode === m.value}
                        onChange={() => setTeachingMode(m.value)} className="sr-only" />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <SaveCancelBar section="professional" />
          </div>
        ) : (
          <>
            <InfoRow label="Qualification" value={tp?.qualification} />
            <InfoRow label="Subjects" value={tp?.subjectExpertise?.join(", ")} />
            <InfoRow label="Classes" value={tp?.classesTeach?.map((c: string) => `Class ${c}`).join(", ")} />
            <InfoRow label="Experience" value={tp?.yearsOfExperience ? `${tp.yearsOfExperience} years` : undefined} />
            <InfoRow label="Teaching Mode" value={tp?.teachingMode} />
          </>
        )}
      </SectionCard>

      {/* ── About ──────────────────────────────────────────────────────────── */}
      <SectionCard title="About" icon={Users} action={<EditButton section="about" />}>
        {editing === "about" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Bio</Label>
                <span className={cn("text-xs", bio.length > BIO_MAX ? "text-destructive" : "text-muted-foreground")}>
                  {bio.length}/{BIO_MAX}
                </span>
              </div>
              <Textarea value={bio} onChange={e => setBio(e.target.value.slice(0, BIO_MAX))}
                placeholder="Tell students about your teaching style, achievements, or passion…"
                rows={4} className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label>Previous Institute / Organisation</Label>
              <Input value={previousInstitute} onChange={e => setPreviousInstitute(e.target.value)}
                placeholder="e.g. Allen Career Institute, Kota" />
            </div>
            <SaveCancelBar section="about" />
          </div>
        ) : (
          <>
            <InfoRow label="Bio" value={tp?.bio} />
            <InfoRow label="Previous Institute" value={tp?.previousInstitute} />
          </>
        )}
      </SectionCard>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Subjects", value: tp?.subjectExpertise?.length ?? 0, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Classes", value: tp?.classesTeach?.length ?? 0, icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Exp (yrs)", value: tp?.yearsOfExperience ?? "—", icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

    </motion.div>
  );
}
