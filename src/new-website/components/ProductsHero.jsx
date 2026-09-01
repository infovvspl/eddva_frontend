// ProductsHero.jsx — /products
// Opening band from the supplied mockup: pill badge, two-line headline with the
// second line in brand blue, a standfirst, and an illustrated stage on the
// right ringed by floating feature chips.
//
// The mockup's stage is a photo of a student that we do not have as an asset
// (the one photo in the repo has a school name baked into the image, so it
// cannot stand in). The stage is drawn instead — a dashboard card with the
// chips orbiting it — which keeps the composition without inventing artwork.
//
// Headline and standfirst are transcribed from the mockup.

import {
  PlayCircle, BarChart3, Cpu, ClipboardCheck, Settings2, GraduationCap,
} from "lucide-react";
import useInView from "../hooks/useInView";

const chips = [
  { id: "live",   Icon: PlayCircle,     accent: "#2563eb", pos: "a" },
  { id: "stats",  Icon: BarChart3,      accent: "#0891b2", pos: "b" },
  { id: "ai",     Icon: Cpu,            accent: "#7c3aed", pos: "c" },
  { id: "tests",  Icon: ClipboardCheck, accent: "#16a34a", pos: "d" },
  { id: "ops",    Icon: Settings2,      accent: "#ea580c", pos: "e" },
  { id: "grad",   Icon: GraduationCap,  accent: "#dc2626", pos: "f" },
];

const ProductsHero = () => {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section className={`nw-phero${inView ? " nw-in" : ""}`} id="nw-products-hero" ref={ref}>
      <span className="nw-phero__blob nw-phero__blob--a" aria-hidden="true" />
      <span className="nw-phero__blob nw-phero__blob--b" aria-hidden="true" />
      <span className="nw-phero__dots nw-phero__dots--l" aria-hidden="true" />
      <span className="nw-phero__dots nw-phero__dots--r" aria-hidden="true" />

      <div className="nw-phero__container">
        <div className="nw-phero__copy">
          <span className="nw-phero__badge">Our Products</span>
          <h1 className="nw-phero__title">
            Smarter Technology for<br />
            <span className="nw-phero__title-accent">Smarter Education</span>
          </h1>
          <p className="nw-phero__lead">
            A unified ecosystem of LMS, ERP and AI tools — empowering
            institutes, teachers and students to achieve more.
          </p>
        </div>

        <div className="nw-phero__stage" aria-hidden="true">
          {/* Dashboard stand-in */}
          <div className="nw-phero__screen">
            <span className="nw-phero__screen-bar" />
            <span className="nw-phero__screen-line nw-phero__screen-line--wide" />
            <span className="nw-phero__screen-line" />
            <div className="nw-phero__screen-chart">
              <span style={{ "--h": "38%" }} />
              <span style={{ "--h": "64%" }} />
              <span style={{ "--h": "46%" }} />
              <span style={{ "--h": "88%" }} />
              <span style={{ "--h": "56%" }} />
            </div>
          </div>

          {chips.map(({ id, Icon, accent, pos }, i) => (
            <span
              key={id}
              className={`nw-phero__chip nw-phero__chip--${pos}`}
              style={{ "--nw-chip-accent": accent, "--i": i }}
            >
              <Icon size={20} strokeWidth={1.9} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsHero;
