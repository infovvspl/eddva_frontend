import { Sparkles, Award, Target, TrendingUp, BookOpen } from "lucide-react";
import heroImg from "@/assets/hero_illustration.png";
import founderPhoto from "@/assets/sir 1.png";
import teamImg1 from "@/assets/img 1.png";
import teamImg2 from "@/assets/img 2.png";
import teamImg3 from "@/assets/img 3.png";
import teamImg4 from "@/assets/img 4.png";
import teamImg5 from "@/assets/img 5.png";
import teamImg6 from "@/assets/img 6.png";
import { B, P } from "@/components/landing/DesignTokens";

const gradHero = `linear-gradient(135deg, ${B}, ${P})`;

const aboutParagraphs = [
  "Eddva exists at the intersection of intelligence and intention.",
  "We are redefining learning as an experience that is not only effective—but elevated. Moving beyond outdated systems, we offer an environment where understanding is deep, progress is deliberate, and growth is inevitable.",
  "Our philosophy is simple: Learning should be as refined as the ambitions it serves. This is why Eddva is designed to adapt, evolve, and respond to you—creating a seamless flow of knowledge that aligns with your pace and sharpens your thinking.",
  "Here, learning is not passive. It is precise. Purposeful. Transformative. This is not traditional education. This is intelligent mastery.",
] as const;

const team: {
  name: string;
  role: string;
  detail: string;
  accent: string;
  photo: string;
}[] = [
  {
    name: "Ankit Tripathi",
    role: "Additional Director",
    detail: "Leadership, strategy, and long-term value for Eddva and the learners it serves",
    accent: "from-slate-500/50 to-indigo-500/50",
    photo: teamImg2,
  },
  {
    name: "Ayush Kumar Dubey",
    role: "Senior JEE educator",
    detail: "A decade of experience in academic excellence and student success",
    accent: "from-blue-500/40 to-purple-500/40",
    photo: teamImg1,
  },
  {
    name: "Priyanka SV",
    role: "Marketing Head",
    detail: "Strategic storytelling and brand vision",
    accent: "from-purple-500/50 to-pink-400/30",
    photo: teamImg3,
  },
  {
    name: "Subham Mishra",
    role: "Full-Stack AI/ML Developer",
    detail: "Architect of intelligent learning systems",
    accent: "from-cyan-400/40 to-blue-500/50",
    photo: teamImg6,
  },
  {
    name: "Akankshya Kar",
    role: "AI/ML Developer",
    detail: "Enhancing adaptive intelligence and personalization",
    accent: "from-fuchsia-400/40 to-purple-500/40",
    photo: teamImg5,
  },
  {
    name: "Bhagyashree Sendh",
    role: "Full-Stack Developer",
    detail: "Crafting seamless and refined digital experiences",
    accent: "from-emerald-400/35 to-teal-500/40",
    photo: teamImg4,
  },

];

const founderParagraphs = [
  "Lt. Col. Anil Tripathi (Retd.), Sena Medal Awardee, embodies a legacy of discipline, leadership, and purpose. From serving the nation with distinction to building Port Translogistics Pvt. Ltd. into a respected enterprise, his journey reflects a relentless pursuit of excellence.",
  "Yet, beyond achievement, he recognized a deeper gap—a learning system that lacked adaptability, depth, and true understanding.",
  "He envisioned something better: a platform that doesn’t just deliver information, but interprets, adapts, and empowers.",
  "Eddva was born from that vision—a refined learning ecosystem designed for those who refuse to settle for conventional paths.",
  "Because true growth is not about access to knowledge—it is about mastering it with clarity and intent.",
] as const;

/** About page marketing sections (from `landing/about` design system), for use inside `LandingLayout`. */
export function AboutMarketing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. About copy + hero image side by side */}
      <section className="relative overflow-hidden border-b border-slate-200/80">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-100" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-start lg:gap-12 lg:py-24">
          <div className="mx-auto max-w-2xl space-y-6 text-center lg:mx-0 lg:max-w-none lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> About Eddva
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              A new standard in{" "}
              <span className="text-gradient-brand">learning</span>
            </h1>
            <div className="mx-auto max-w-[60ch] space-y-4 text-base leading-relaxed text-foreground/85 sm:text-lg lg:mx-0 lg:max-w-none">
              {aboutParagraphs.map((p, i) => (
                <p key={i} className={i === 0 ? "font-medium text-foreground/90" : undefined}>
                  {p}
                </p>
              ))}
            </div>
       
          </div>
          <div className="relative mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none lg:sticky lg:top-28">
            <div
              className="absolute -inset-6 rounded-[2rem] opacity-25 blur-2xl"
              style={{ background: gradHero }}
              aria-hidden
            />
            <img
              src={heroImg}
              alt="Student exploring AI-powered learning"
              width={1536}
              height={768}
              className="relative w-full rounded-3xl object-cover shadow-xl shadow-purple-500/20"
            />
          </div>
        </div>
      </section>

      {/* 2. Founder&apos;s Story */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-16">
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Award className="h-3.5 w-3.5" /> Founder&apos;s Story
            </span>
            <h2 className="mt-6 text-3xl font-bold sm:text-4xl">Built on discipline. Driven by vision.</h2>
            <p className="mx-auto mt-2 max-w-[52ch] text-xl font-medium text-muted-foreground lg:mx-0 lg:max-w-none">
              Lt. Col. Anil Tripathi (Retd.), Sena Medal Awardee
            </p>
            <div className="mx-auto mt-8 max-w-[60ch] space-y-4 text-base leading-relaxed text-foreground/85 sm:text-lg lg:mx-0 lg:max-w-none">
              {founderParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          <figure className="relative mx-auto w-full max-w-sm shrink-0 lg:mx-0 group">
            {/* Decorative soft glow */}
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl transition-all duration-500 group-hover:from-blue-500/20 group-hover:to-purple-500/20" aria-hidden="true" />
            
            {/* Premium layered frame */}
            <div className="relative rounded-[2rem] bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition-transform duration-500 group-hover:-translate-y-1">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-slate-50">
                <img
                  src={founderPhoto}
                  alt="Lt. Col. Anil Tripathi (Retd.), Sena Medal Awardee"
                  loading="lazy"
                  width={640}
                  height={800}
                  className="aspect-[4/5] w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            </div>
            
            <figcaption className="mt-5 text-center text-[14px] font-bold text-slate-500 transition-colors duration-300 group-hover:text-blue-600 lg:text-left">
              Lt. Col. Anil Tripathi (Retd.), Sena Medal Awardee
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 3. Team */}
      <section className="bg-gradient-to-b from-slate-50 via-white to-slate-100 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Divider />
          <div className="mx-auto mb-12 mt-12 max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary shadow-sm">
              Our Team
            </span>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                Where expertise meets <span className="text-gradient-brand">innovation</span>
              </h2>
            <p className="mt-3 text-muted-foreground">
              Eddva is shaped by a collective of educators, technologists, and visionaries - each committed to delivering excellence at every layer of the experience.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <TeamCard key={m.name} {...m} />
            ))}
          </div>
          <div className="mt-12">
            <Divider />
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label, icon: Icon, color }: { value: string; label: string; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/50 p-5 shadow-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-md">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-left">
        <div className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{value}</div>
        <div className="mt-0.5 text-xs font-semibold text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function TeamCard({
  name,
  role,
  photo,
}: {
  name: string;
  role: string;
  photo: string;
}) {
  return (
    <div className="group relative h-full rounded-[2rem] bg-gradient-to-br from-purple-500 to-blue-500 p-[2px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20">
      <div className="flex h-full flex-col rounded-[calc(2rem-2px)] bg-white/95 p-6 text-center shadow-sm backdrop-blur-sm">
        <div className="relative mx-auto h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-md shadow-slate-300/60 sm:h-36 sm:w-36">
          <img
            src={photo}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover object-center"
            width={400}
            height={400}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="mt-6 flex grow flex-col justify-center">
          <h3 className="text-xl font-extrabold text-foreground sm:text-2xl">{name}</h3>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.15em] text-primary sm:text-sm">{role}</p>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="h-px w-full"
      style={{
        backgroundImage: `repeating-linear-gradient(to right, ${P}66 0 6px, transparent 6px 12px)`,
      }}
    />
  );
}
