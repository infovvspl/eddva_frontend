import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Brain,
  Target,
  Globe2,
  Rocket,
  Award,
  BookOpen,
  Users,
  Linkedin,
  Twitter,
  Github,
} from "lucide-react";
import founderImg from "@/assets/founder.png";
import heroImg from "@/assets/hero-learning.jpg";
import isoImg from "@/assets/iso-network.jpg";
import aanyaImg from "@/assets/team-aanya.jpg";
import karthikImg from "@/assets/team-karthik.jpg";
import meeraImg from "@/assets/team-meera.jpg";
import arjunImg from "@/assets/team-arjun.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About EDDVA — Building the Future of Learning" },
      {
        name: "description",
        content:
          "EDDVA leverages AI to create personalized educational experiences that adapt to every student's pace, style, and dreams.",
      },
      { property: "og:title", content: "About EDDVA — Building the Future of Learning" },
      {
        property: "og:description",
        content:
          "Discover how EDDVA's AI-powered platform is reshaping education for over 1.2M learners worldwide.",
      },
      { property: "og:image", content: heroImg },
      { name: "twitter:image", content: heroImg },
    ],
  }),
  component: AboutPage,
});

const team = [
  { name: "Dr. Rajeev Sharma", role: "Founder & CEO", img: founderImg, accent: "from-brand-blue/40 to-brand-purple/40" },
  { name: "Aanya Verma", role: "Chief Learning Officer", img: aanyaImg, accent: "from-brand-purple/50 to-pink-400/30" },
  { name: "Karthik Iyer", role: "Head of AI Research", img: karthikImg, accent: "from-brand-blue/50 to-cyan-400/30" },
  { name: "Meera Kapoor", role: "Director of Curriculum", img: meeraImg, accent: "from-fuchsia-400/40 to-brand-purple/40" },
  { name: "Arjun Nair", role: "Lead Developer", img: arjunImg, accent: "from-cyan-400/40 to-brand-blue/50" },
];

const features = [
  {
    icon: Brain,
    title: "Adaptive AI Engine",
    desc: "Learns how each student thinks and personalises every lesson in real time.",
  },
  {
    icon: Target,
    title: "Goal-Driven Paths",
    desc: "Crystal-clear roadmaps for JEE, NEET, UPSC and 20+ competitive exams.",
  },
  {
    icon: Globe2,
    title: "Global Classroom",
    desc: "1.2M+ learners across 40 countries collaborating in one ecosystem.",
  },
  {
    icon: Rocket,
    title: "Smart Practice",
    desc: "Spaced-repetition + weakness mapping that turns mistakes into mastery.",
  },
  {
    icon: Award,
    title: "Proven Outcomes",
    desc: "98% of students report measurable improvement in under 60 days.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-soft" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> About EDDVA
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">
              Building the <br />
              <span className="text-gradient-brand">Future of Learning</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              At EDDVA, we believe education isn't one-size-fits-all. We're
              leveraging AI to craft personalised experiences that adapt to every
              student's pace, style and dreams.
            </p>
            <div className="flex flex-wrap gap-8 pt-2">
              <Stat value="1.2M+" label="Global Learners" />
              <Stat value="50K+" label="Total Selections" />
              <Stat value="98%" label="Success Rate" />
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-hero opacity-20 blur-2xl" />
            <img
              src={heroImg}
              alt="Student exploring AI-powered learning"
              width={1536}
              height={768}
              className="relative w-full rounded-3xl object-cover shadow-glow"
            />
          </div>
        </div>
      </section>

      {/* WHO IS EDDVA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-[1fr_auto] md:items-start md:gap-16">
          <div>
            <span className="inline-flex items-center rounded-full bg-brand-ink px-5 py-2 text-sm font-bold tracking-wide text-white shadow-card-soft">
              EDDVA <span className="ml-1 text-brand-purple">?</span>
            </span>
            <p className="mt-8 text-lg italic leading-relaxed text-foreground/80 md:text-xl">
              At EDDVA, we believe that education is not one-size-fits-all. We are
              leveraging AI to create personalised experiences that adapt to every
              student's pace, style and dreams. From JEE aspirants in Kota to UPSC
              hopefuls in Delhi, every learner gets a curriculum that thinks the
              way they do — and grows the way they want to grow.
            </p>
          </div>
          <figure className="mx-auto w-fit shrink-0">
            <div className="relative h-72 w-56 overflow-hidden rounded-t-full rounded-b-2xl border-2 border-brand-purple/30 bg-brand-soft shadow-card-soft">
              <img
                src={founderImg}
                alt="Dr. Rajeev Sharma, Founder of EDDVA"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="mt-3 text-center text-sm font-semibold text-foreground">
              Dr. Rajeev Sharma
              <span className="block text-xs font-normal text-muted-foreground">
                Founder & CEO
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* MISSION + ILLUSTRATION */}
      <section className="bg-gradient-soft py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-hero opacity-10 blur-2xl" />
            <img
              src={isoImg}
              alt="Global learning network illustration"
              loading="lazy"
              width={1024}
              height={768}
              className="relative w-full rounded-3xl"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              One platform. <span className="text-gradient-brand">Infinite paths.</span>
            </h2>
            <p className="mt-6 text-lg italic leading-relaxed text-foreground/80">
              At EDDVA, we believe education is not one-size-fits-all. Our AI
              connects learners, mentors and content across the globe — turning a
              single platform into a living, breathing classroom that adapts to
              every student's pace, style and dreams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BadgePill icon={BookOpen} label="20+ Exams" />
              <BadgePill icon={Users} label="40+ Countries" />
              <BadgePill icon={Award} label="24/7 Mentorship" />
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Divider />
        <div className="mb-10 mt-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              The minds behind <span className="text-gradient-brand">EDDVA</span>
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              A team of educators, engineers and dreamers shaping how the next
              billion learn.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {team.map((m, i) => (
            <TeamCard key={m.name} {...m} index={i} />
          ))}
        </div>
        <div className="mt-12">
          <Divider />
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Why EDDVA
            </span>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl md:text-5xl">
              Why students <span className="text-gradient-brand">choose us</span>
            </h2>
          </div>
          <p className="max-w-sm text-muted-foreground md:text-right">
            Five pillars that make EDDVA different from anything you've tried before.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2 md:auto-rows-[200px]">
          <FeatureHero {...features[0]} />
          <FeatureTile {...features[1]} index={1} variant="light" />
          <FeatureTile {...features[2]} index={2} variant="dark" />
          <FeatureTile {...features[3]} index={3} variant="dark" />
          <FeatureTile {...features[4]} index={4} variant="accent" />
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 rounded-3xl bg-gradient-hero p-10 text-center shadow-glow">
          <h3 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to learn the smarter way?
          </h3>
          <p className="max-w-md text-white/85">
            Join 1.2M+ learners already personalising their journey with EDDVA.
          </p>
          <Link
            to="/"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-primary transition-transform hover:scale-105"
          >
            Start Learning <Rocket className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {value}
      </div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function BadgePill({ icon: Icon, label }: { icon: typeof BookOpen; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </span>
  );
}

function TeamCard({
  name,
  role,
  img,
  accent,
}: {
  name: string;
  role: string;
  img?: string;
  accent?: string;
  index: number;
}) {
  return (
    <article className="group flex flex-col items-center text-center">
      <div className="relative">
        <div
          className={`absolute -inset-2 rounded-full bg-gradient-to-br ${accent ?? "from-brand-blue/40 to-brand-purple/40"} opacity-60 blur-md transition-opacity duration-500 group-hover:opacity-100`}
        />
        <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-card-soft transition-transform duration-500 group-hover:-translate-y-1 sm:h-36 sm:w-36">
          <img
            src={img}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      </div>
      <h3 className="mt-5 text-base font-bold text-foreground">{name}</h3>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {role}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <SocialDot icon={Linkedin} />
        <SocialDot icon={Twitter} />
        <SocialDot icon={Github} />
      </div>
    </article>
  );
}

function SocialDot({ icon: Icon }: { icon: typeof Linkedin }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-purple/30 bg-white text-primary transition-all duration-300 hover:scale-110 hover:bg-gradient-hero hover:text-white hover:border-transparent">
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

function FeatureHero({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Brain;
  title: string;
  desc: string;
}) {
  return (
    <article className="group relative overflow-hidden rounded-3xl bg-gradient-hero p-7 shadow-glow transition-all duration-500 hover:-translate-y-1 md:col-span-3 md:row-span-2 md:p-9">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-brand-purple/40 blur-3xl" />
      <div className="relative flex h-full min-h-[320px] flex-col">
        <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
          01 · Featured
        </span>
        <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-md">
          <Icon className="h-8 w-8" />
        </div>
        <div className="mt-auto pt-8">
          <h3 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
            {title}
          </h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85 sm:text-base">
            {desc}
          </p>
        </div>
      </div>
    </article>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  desc,
  index,
  variant,
}: {
  icon: typeof Brain;
  title: string;
  desc: string;
  index: number;
  variant: "light" | "dark" | "accent";
}) {
  const styles = {
    light:
      "bg-white border border-brand-purple/15 text-foreground hover:border-brand-purple/40",
    dark: "bg-brand-ink border border-white/5 text-white hover:border-brand-purple/50",
    accent:
      "bg-brand-soft border border-brand-purple/20 text-foreground hover:border-brand-purple/40",
  } as const;

  const iconStyles = {
    light: "bg-gradient-hero text-white shadow-glow",
    dark: "bg-white/10 text-white ring-1 ring-white/20 backdrop-blur",
    accent: "bg-white text-primary shadow-card-soft",
  } as const;

  const isDark = variant === "dark";

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl p-5 shadow-card-soft transition-all duration-500 hover:-translate-y-1 md:col-span-3 ${styles[variant]}`}
    >
      <span
        className={`absolute right-4 top-4 text-[10px] font-bold tracking-widest ${isDark ? "text-white/30" : "text-foreground/25"}`}
      >
        0{index + 1}
      </span>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconStyles[variant]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold leading-tight sm:text-lg">{title}</h3>
      </div>
      <p
        className={`mt-3 text-xs leading-relaxed sm:text-sm ${isDark ? "text-white/70" : "text-muted-foreground"}`}
      >
        {desc}
      </p>
      {isDark && (
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-gradient-hero opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40" />
      )}
    </article>
  );
}

function Divider() {
  return (
    <div
      className="h-px w-full"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, color-mix(in oklab, var(--brand-purple) 40%, transparent) 0 6px, transparent 6px 12px)",
      }}
    />
  );
}
