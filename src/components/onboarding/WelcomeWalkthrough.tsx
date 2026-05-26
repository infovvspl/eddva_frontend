import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import type { UserRole } from "@/lib/types";
import {
  Brain, Swords, Video, BarChart, MessageSquare, Sparkles,
  Users, BookOpen, GraduationCap, Trophy, CheckCircle2,
  ArrowRight, X, Zap, Shield, Star, Rocket, Check,
} from "lucide-react";

// ─── Tour step: welcome hero (no feature cards — those are in Features step) ──

const TOUR_CONTENT: Record<UserRole, {
  headline: string;
  sub: string;
  emoji: string;
  tagline: string;
  bullets: string[];
}> = {
  student: {
    headline: "Welcome to Edva!",
    sub: "Your AI-powered learning companion.",
    emoji: "🎓",
    tagline: "Learn smarter. Compete harder. Grow faster.",
    bullets: [
      "Ask doubts anytime — AI answers in seconds",
      "Attend live lectures and rewatch recordings",
      "Battle classmates in real-time quiz arena",
      "Track your rank, XP, and weak areas daily",
    ],
  },
  teacher: {
    headline: "Welcome, Teacher!",
    sub: "Everything you need to teach effectively.",
    emoji: "📚",
    tagline: "Teach better. Save time. See results.",
    bullets: [
      "AI pre-drafts doubt responses — you just review",
      "Upload lectures and go live with one click",
      "Build quizzes and mock tests using AI",
      "See exactly who's struggling and who's thriving",
    ],
  },
  institute_admin: {
    headline: "Welcome, Admin!",
    sub: "Run your institute from one dashboard.",
    emoji: "🏫",
    tagline: "Manage everything. Miss nothing.",
    bullets: [
      "Create batches and assign teachers per subject",
      "Enroll students in bulk, track fees and access",
      "Build full-length mock tests with AI analysis",
      "Monitor performance across all batches at once",
    ],
  },
  super_admin: {
    headline: "Welcome, Super Admin!",
    sub: "Full governance across the entire platform.",
    emoji: "⚡",
    tagline: "One panel. Every institute. Total control.",
    bullets: [
      "Create and isolate every institute as a tenant",
      "Assign and upgrade subscription plans",
      "View global usage, growth, and revenue stats",
      "Push announcements across all institutes instantly",
    ],
  },
};

// ─── Features step: detailed breakdown (distinct from tour bullets above) ─────

const FEATURES_CONTENT: Record<UserRole, {
  label: string; icon: React.ComponentType<{ className?: string }>; color: string; desc: string;
}[]> = {
  student: [
    { label: "AI Doubt Solver",   icon: Brain,    color: "text-blue-500",    desc: "Step-by-step explanations from AI. If it doesn't help, it escalates directly to your teacher." },
    { label: "Battle Arena",      icon: Swords,   color: "text-red-500",     desc: "Head-to-head quiz battles with real-time scoring — the fastest way to retain what you study." },
    { label: "Study Plan",        icon: BookOpen, color: "text-emerald-500", desc: "Daily plan personalised to your exam, target college, and current weak areas." },
    { label: "Progress Tracker",  icon: BarChart, color: "text-violet-500",  desc: "Subject-wise accuracy trends, streak count, and XP history — all in one view." },
  ],
  teacher: [
    { label: "AI Doubt Assistant", icon: Sparkles,      color: "text-blue-500",    desc: "Every escalated doubt gets an AI-drafted response. You review, edit, and send — no blank-page problem." },
    { label: "Lecture Studio",     icon: Video,         color: "text-red-500",     desc: "Upload recorded or go live. Attach notes, set checkpoints, and track who watched what." },
    { label: "Quiz Builder",       icon: BookOpen,      color: "text-emerald-500", desc: "Generate topic-wise questions at any difficulty with one click. Edit before publishing." },
    { label: "Student Analytics",  icon: BarChart,      color: "text-violet-500",  desc: "Batch-level watch time, quiz scores, and doubt volume — find who needs help before they drop off." },
  ],
  institute_admin: [
    { label: "Batch Management",    icon: GraduationCap, color: "text-blue-500",    desc: "Create courses, assign subject teachers, set schedules, and control student access per batch." },
    { label: "Student Roster",      icon: Users,         color: "text-red-500",     desc: "Bulk enroll via CSV, track individual fee status, suspend or restore access instantly." },
    { label: "Mock Tests",          icon: BookOpen,      color: "text-emerald-500", desc: "Full-length sectional exams with timer, auto-grading, and AI-generated performance reports." },
    { label: "Institute Analytics", icon: BarChart,      color: "text-violet-500",  desc: "Engagement rates, teacher activity, top/bottom performers — all filterable by batch or date." },
  ],
  super_admin: [
    { label: "Multi-Tenant",     icon: Users,    color: "text-blue-500",    desc: "Each institute is a fully isolated tenant with its own data, users, and branding." },
    { label: "Plan Management",  icon: Star,     color: "text-amber-500",   desc: "Assign, upgrade, or downgrade subscription plans per institute from a single panel." },
    { label: "Platform Stats",   icon: BarChart, color: "text-emerald-500", desc: "Global student counts, revenue dashboards, and feature adoption metrics across all tenants." },
    { label: "Announcements",    icon: Zap,      color: "text-violet-500",  desc: "Broadcast urgent messages or updates to all institutes or select tenants at once." },
  ],
};

// ─── Plans step (admins only) ─────────────────────────────────────────────────

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    icon: Zap,
    color: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-500",
    price: "Free",
    features: ["50 students", "2 teachers", "AI doubt solving", "Recorded lectures"],
  },
  {
    key: "growth",
    name: "Growth",
    icon: Rocket,
    color: "border-primary",
    iconColor: "text-primary",
    price: "₹4,999/mo",
    highlight: true,
    features: ["300 students", "10 teachers", "Live lectures", "Mock tests", "Analytics", "Battle Arena"],
  },
  {
    key: "scale",
    name: "Scale",
    icon: Star,
    color: "border-violet-300 dark:border-violet-700",
    iconColor: "text-violet-500",
    price: "₹12,999/mo",
    features: ["Unlimited students", "Unlimited teachers", "Custom branding", "Priority support"],
  },
];

// ─── Slide animation ──────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Step components ──────────────────────────────────────────────────────────

function AppTourStep({ role }: { role: UserRole }) {
  const c = TOUR_CONTENT[role];
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <div className="text-6xl">{c.emoji}</div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">{c.headline}</h2>
        <p className="text-muted-foreground mt-1.5 text-sm">{c.sub}</p>
      </div>
      <p className="text-base font-semibold text-primary">{c.tagline}</p>
      <ul className="space-y-2.5 text-left max-w-sm w-full">
        {c.bullets.map((b) => (
          <li key={b} className="flex items-start gap-3 text-sm text-foreground">
            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-px">
              <Check className="w-3 h-3 text-primary" />
            </span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeaturesStep({ role }: { role: UserRole }) {
  const features = FEATURES_CONTENT[role];
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Key Features</h2>
        <p className="text-muted-foreground mt-1.5 text-sm">Here's what you'll use every day.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-muted/30 text-left"
            >
              <div className="flex items-center gap-2">
                <Icon className={cn("w-5 h-5 shrink-0", f.color)} />
                <p className="text-sm font-semibold text-foreground">{f.label}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function PlansStep({ currentPlan }: { currentPlan?: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Subscription Plans</h2>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Your institute is on the{" "}
          <span className="font-semibold capitalize text-foreground">{currentPlan ?? "Starter"}</span> plan.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = plan.key === currentPlan;
          return (
            <div
              key={plan.key}
              className={cn(
                "flex flex-col gap-3 p-4 rounded-xl border-2 text-left relative",
                plan.highlight ? "border-primary shadow-md shadow-primary/10" : plan.color,
                isCurrent && "ring-2 ring-primary/30"
              )}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                  Current Plan
                </span>
              )}
              <div className="flex items-center gap-2">
                <Icon className={cn("w-4 h-4", plan.iconColor)} />
                <span className="text-sm font-bold text-foreground">{plan.name}</span>
                {plan.highlight && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Popular</span>
                )}
              </div>
              <p className="text-base font-bold text-foreground">{plan.price}</p>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-px" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Contact us to upgrade your plan anytime.</p>
    </div>
  );
}

// ─── Main walkthrough ─────────────────────────────────────────────────────────

interface Props {
  onDone: () => void;
}

export function WelcomeWalkthrough({ onDone }: Props) {
  const { user } = useAuthStore();
  const role = user?.role ?? "student";
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const isAdmin = role === "institute_admin" || role === "super_admin";
  const totalSteps = isAdmin ? 3 : 2;

  function go(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  const isLast = step === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <button
          onClick={onDone}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Skip tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step content */}
        <div className="p-8 pb-4 min-h-[420px] flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="w-full"
            >
              {step === 0 && <AppTourStep role={role} />}
              {step === 1 && <FeaturesStep role={role} />}
              {step === 2 && isAdmin && <PlansStep currentPlan={undefined} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === step
                    ? "w-6 h-2 bg-primary"
                    : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => go(step - 1)}
                className="px-4 py-2 text-sm font-medium border border-border rounded-xl hover:bg-muted transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => isLast ? onDone() : go(step + 1)}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              {isLast ? "Get Started" : "Next"}
              {!isLast && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
