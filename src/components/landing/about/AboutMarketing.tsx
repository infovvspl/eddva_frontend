import { Sparkles, Award } from "lucide-react";
import heroImg from "@/assets/hero_illustration.png";
import founderImg from "@/assets/glowing-lightbulb-with-graduation-cap-icon-floating-digital-space-learning-new-skill-progress_982248-12957.jpg";
import { B, P } from "@/components/landing/DesignTokens";

const gradHero = `linear-gradient(135deg, ${B}, ${P})`;

const aboutParagraphs = [
  "We're not here to follow the old way of learning—we're here to completely redefine it.",
  "EDDVA is built on AI that feels sharp and intuitive: less rote memorization, more real understanding. We help you move ahead with clarity and confidence—not just keep up.",
  "Learning should adapt to you, not the other way around. Our platform listens, responds, and aligns with your pace, curiosity, and thinking—in real time.",
  "Knowledge here is something you discover and own. Doubts go deeper; every step moves you toward clarity.",
  "We don't believe in learning more for its own sake. We believe in learning better, smarter, and with purpose—because this isn't only education. It's the future of learning.",
] as const;

const team = [
  {
    name: "Ayush Kumar Dubey",
    role: "Senior Educator",
    detail: "9–10 Years of Experience",
    img: "https://i.pravatar.cc/300?img=12",
    accent: "from-blue-500/40 to-purple-500/40",
  },
  {
    name: "Priyanka SV",
    role: "Marketing Head",
    img: "https://i.pravatar.cc/300?img=45",
    accent: "from-purple-500/50 to-pink-400/30",
  },
  {
    name: "Subham Mishra",
    role: "Full-Stack AI/ML Developer",
    img: "https://i.pravatar.cc/300?img=33",
    accent: "from-cyan-400/40 to-blue-500/50",
  },
  {
    name: "Akankshya Kar",
    role: "AI/ML Developer",
    img: "https://i.pravatar.cc/300?img=47",
    accent: "from-fuchsia-400/40 to-purple-500/40",
  },
  {
    name: "Bhagyashree Sendh",
    role: "Full-Stack Developer",
    img: "https://i.pravatar.cc/300?img=32",
    accent: "from-emerald-400/35 to-teal-500/40",
  },
];

const founderParagraphs = [
  "Lt. Col. Anil Tripathi, Sena Medal awardee (Retd.), served the nation with discipline and purpose. He went on to build Port Translogistics Pvt. Ltd. into a respected logistics brand—proof of his resilience and leadership.",
  "Beyond business, he saw a gap: how people learn and grow wasn't keeping pace with a changing world.",
  "That insight became a vision—a platform that understands, adapts, and empowers. Today it is the foundation of EDDVA: learning with intelligence, personalization, and purpose.",
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
              <Sparkles className="h-3.5 w-3.5" /> About us
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">
              About <span className="text-gradient-brand">us</span>
            </h1>
            <div className="space-y-4 text-base leading-relaxed text-foreground/85 sm:text-lg">
              {aboutParagraphs.map((p, i) => (
                <p key={i} className={i === 0 ? "font-medium text-foreground/90" : undefined}>
                  {p}
                </p>
              ))}
            </div>
            <div className="flex flex-wrap gap-8 border-t border-slate-200/80 pt-8">
              <Stat value="1.2M+" label="Global Learners" />
              <Stat value="50K+" label="Total Selections" />
              <Stat value="98%" label="Success Rate" />
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
            <h2 className="mt-6 text-3xl font-bold sm:text-4xl">Lt. Col. Anil Tripathi</h2>
            <p className="mt-2 text-sm font-medium text-muted-foreground">Sena Medal awardee (Retd.)</p>
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
              A vision shaped by service, enterprise, and a commitment to how the world learns next.
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
                The Minds Behind <span className="text-gradient-brand">the Platform</span>
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Educators, builders, and strategists working together to ship a smarter learning experience.
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
