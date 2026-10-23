// WhyChooseGrid.jsx — /products
// "Why Choose EDDVA" — six light cards, three across, from the supplied mockup.
//
// Distinct from WhyChooseSection, which is the dark counting-stats band used on
// the solution page; the two are not interchangeable despite the similar name.
//
// All copy here is transcribed from the mockup and is not otherwise signed off.

import { BrainCircuit, BookOpen, BarChart3, ShieldCheck, Tablet, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import useInView from "../hooks/useInView";

const reasons = [
  {
    id: "nw-wc-ai",
    Icon: BrainCircuit,
    accent: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    id: "nw-wc-ecosystem",
    Icon: BookOpen,
    accent: "#2563eb",
    bg: "#eff6ff",
  },
  {
    id: "nw-wc-scale",
    Icon: BarChart3,
    accent: "#0891b2",
    bg: "#ecfeff",
  },
  {
    id: "nw-wc-secure",
    Icon: ShieldCheck,
    accent: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    id: "nw-wc-anywhere",
    Icon: Tablet,
    accent: "#ea580c",
    bg: "#fff7ed",
  },
  {
    id: "nw-wc-success",
    Icon: Users,
    accent: "#dc2626",
    bg: "#fef2f2",
  },
];

const WhyChooseGrid = () => {
  const { t } = useTranslation("products");
  const [ref, inView] = useInView({ threshold: 0.12 });

  return (
    <section className="nw-wchoose" id="nw-why-choose-eddva">
      <div className="nw-wchoose__container">

        <header className="nw-wchoose__header">
          <h2 className="nw-wchoose__heading">
            {t("why.headingPre")}<span className="nw-wchoose__heading-accent">{t("why.headingAccent")}</span>{t("why.headingPost", { defaultValue: "" })}
          </h2>
          <p className="nw-wchoose__lead">
            {t("why.lead")}
          </p>
        </header>

        <div className={`nw-wchoose__grid${inView ? " nw-in" : ""}`} ref={ref}>
          {reasons.map(({ id, Icon, accent, bg }, i) => (
            <article
              className="nw-wchoose__card"
              key={id}
              id={id}
              style={{ "--i": i, "--nw-wc-accent": accent, "--nw-wc-bg": bg }}
            >
              <span className="nw-wchoose__icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.9} />
              </span>
              <h3 className="nw-wchoose__title">{t(`why.reasons.${id}.title`)}</h3>
              <p className="nw-wchoose__desc">{t(`why.reasons.${id}.desc`)}</p>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyChooseGrid;
