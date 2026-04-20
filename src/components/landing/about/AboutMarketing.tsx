import { Sparkles, Award } from "lucide-react";
import heroImg from "@/assets/hero_illustration.png";
import founderImg from "@/assets/glowing-lightbulb-with-graduation-cap-icon-floating-digital-space-learning-new-skill-progress_982248-12957.jpg";
import { B, P } from "@/components/landing/DesignTokens";

const gradHero = `linear-gradient(135deg, ${B}, ${P})`;

const aboutParagraphs = [
  "Eddva exists at the intersection of intelligence and intention.",
  "We are redefining learning as an experience that is not only effective—but elevated. Moving beyond outdated systems, we offer an environment where understanding is deep, progress is deliberate, and growth is inevitable.",
  "Our philosophy is simple: Learning should be as refined as the ambitions it serves. This is why Eddva is designed to adapt, evolve, and respond to you—creating a seamless flow of knowledge that aligns with your pace and sharpens your thinking.",
  "Here, learning is not passive. It is precise. Purposeful. Transformative. This is not traditional education. This is intelligent mastery.",
] as const;

const team = [
  {
    name: "Ayush Kumar Dubey",
    role: "Senior JEE educator",
    detail: "A decade of experience in academic excellence and student success",
    img: "https://i.pravatar.cc/300?img=12",
    accent: "from-blue-500/40 to-purple-500/40",
  },
  {
    name: "Priyanka SV",
    role: "Marketing Head",
    detail: "Strategic storytelling and brand vision",
    img: "https://i.pravatar.cc/300?img=45",
    accent: "from-purple-500/50 to-pink-400/30",
  },
  {
    name: "Subham Mishra",
    role: "Full-Stack AI/ML Developer",
    detail: "Architect of intelligent learning systems",
    img: "https://i.pravatar.cc/300?img=33",
    accent: "from-cyan-400/40 to-blue-500/50",
  },
  {
    name: "Akankshya Kar",
    role: "AI/ML Developer",
    detail: "Enhancing adaptive intelligence and personalization",
    img: "https://i.pravatar.cc/300?img=47",
    accent: "from-fuchsia-400/40 to-purple-500/40",
  },
  {
    name: "Bhagyashree Sendh",
    role: "Full-Stack Developer",
    detail: "Crafting seamless and refined digital experiences",
    img: "https://i.pravatar.cc/300?img=32",
    accent: "from-emerald-400/35 to-teal-500/40",
  },
];

const founderParagraphs = [
  "Lt. Col. Anil Tripathi (Retd.), Sena Medal awardee, embodies a legacy of discipline, leadership, and purpose. From serving the nation with distinction to building Port Translogistics Pvt. Ltd. into a respected enterprise, his journey reflects a relentless pursuit of excellence.",
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
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-start md:gap-12 md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> About Eddva
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">
              A new standard in{" "}
              <span className="text-gradient-brand">learning</span>
            </h1>
            <div className="space-y-4 text-base leading-relaxed text-foreground/85 sm:text-lg">
              {aboutParagraphs.map((p, i) => (
                <p key={i} className={i === 0 ? "font-medium text-foreground/90" : undefined}>
                  {p}
                </p>
              ))}
            </div>
            <div className="flex flex-wrap gap-8 border-t border-slate-200/80 pt-8">
              <Stat value="Learn" label="with clarity" />
              <Stat value="Perform" label="with confidence" />
              <Stat value="Stay ahead" label="with Eddva" />
            </div>
          </div>
          <div className="relative md:sticky md:top-28">
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
        <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_280px] md:items-start md:gap-16 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Award className="h-3.5 w-3.5" /> Founder&apos;s Story
            </span>
            <h2 className="mt-6 text-3xl font-bold sm:text-4xl">Built on discipline. Driven by vision.</h2>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Lt. Col. Anil Tripathi (Retd.), Sena Medal awardee
            </p>
            <div className="mt-8 space-y-4 text-base leading-relaxed text-foreground/85 sm:text-lg">
              {founderParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          <figure className="mx-auto w-full max-w-sm shrink-0 md:mx-0">
            <div className="relative overflow-hidden rounded-3xl border-2 border-purple-300/40 bg-purple-50/60 shadow-lg shadow-slate-200/50">
              <img
                src={founderImg}
                alt="Vision and leadership in education"
                loading="lazy"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            <figcaption className="mt-3 text-center text-xs text-muted-foreground md:text-left">
              From national service to enterprise—and a vision for how the world should learn next.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 3. Team */}
      <section className="bg-gradient-to-b from-slate-50 via-white to-slate-100 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Divider />
          <div className="mb-10 mt-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Where expertise meets <span className="text-gradient-brand">innovation</span>
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Eddva is shaped by a collective of educators, technologists, and visionaries—each committed to delivering excellence at every layer of the experience.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function TeamCard({
  name,
  role,
  detail,
  img,
  accent,
}: {
  name: string;
  role: string;
  detail?: string;
  img?: string;
  accent?: string;
}) {
  return (
    <article className="group flex flex-col items-center text-center">
      <div className="relative">
        <div
          className={`absolute -inset-2 rounded-full bg-gradient-to-br ${accent ?? "from-blue-500/40 to-purple-500/40"} opacity-60 blur-md transition-opacity duration-500 group-hover:opacity-100`}
        />
        <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-lg shadow-slate-200/60 transition-transform duration-500 group-hover:-translate-y-1 sm:h-36 sm:w-36">
          <img
            src={img}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      </div>
      <h3 className="mt-5 text-base font-bold text-foreground">{name}</h3>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary/90">{role}</p>
      {detail ? <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground sm:text-xs">{detail}</p> : null}
    </article>
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
