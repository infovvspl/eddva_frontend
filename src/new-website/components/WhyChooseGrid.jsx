// WhyChooseGrid.jsx — /products
// "Why Choose EDDVA" — six light cards, three across, from the supplied mockup.
//
// Distinct from WhyChooseSection, which is the dark counting-stats band used on
// the solution page; the two are not interchangeable despite the similar name.
//
// All copy here is transcribed from the mockup and is not otherwise signed off.

import { BrainCircuit, BookOpen, BarChart3, ShieldCheck, Tablet, Users } from "lucide-react";
import useInView from "../hooks/useInView";

const reasons = [
  {
    id: "nw-wc-ai",
    Icon: BrainCircuit,
    title: "AI-Powered Intelligence",
    desc: "Smarter learning with real-time insights",
    accent: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    id: "nw-wc-ecosystem",
    Icon: BookOpen,
    title: "End-to-End Ecosystem",
    desc: "Learning + Management in one platform",
    accent: "#2563eb",
    bg: "#eff6ff",
  },
  {
    id: "nw-wc-scale",
    Icon: BarChart3,
    title: "Scalable for Everyone",
    desc: "Designed for schools, institutes and coaching centres",
    accent: "#0891b2",
    bg: "#ecfeff",
  },
  {
    id: "nw-wc-secure",
    Icon: ShieldCheck,
    title: "Secure & Reliable",
    desc: "Your data, always protected",
    accent: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    id: "nw-wc-anywhere",
    Icon: Tablet,
    title: "Learn Anywhere",
    desc: "Access on web, tablet and mobile",
    accent: "#ea580c",
    bg: "#fff7ed",
  },
  {
    id: "nw-wc-success",
    Icon: Users,
    title: "Student Success First",
    desc: "Built for better results and brighter futures",
    accent: "#dc2626",
    bg: "#fef2f2",
  },
];

const WhyChooseGrid = () => {
  const [ref, inView] = useInView({ threshold: 0.12 });

  return (
    <section className="nw-wchoose" id="nw-why-choose-eddva">
      <div className="nw-wchoose__container">

        <header className="nw-wchoose__header">
          <h2 className="nw-wchoose__heading">
            Why Choose <span className="nw-wchoose__heading-accent">EDDVA</span>
          </h2>
          <p className="nw-wchoose__lead">
            Technology that transforms the way education works.
          </p>
        </header>

        <div className={`nw-wchoose__grid${inView ? " nw-in" : ""}`} ref={ref}>
          {reasons.map(({ id, Icon, title, desc, accent, bg }, i) => (
            <article
              className="nw-wchoose__card"
              key={id}
              id={id}
              style={{ "--i": i, "--nw-wc-accent": accent, "--nw-wc-bg": bg }}
            >
              <span className="nw-wchoose__icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.9} />
              </span>
              <h3 className="nw-wchoose__title">{title}</h3>
              <p className="nw-wchoose__desc">{desc}</p>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyChooseGrid;
