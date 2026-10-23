// CtaBanner.jsx — New Website Mockup
// Violet band: "Ready to Transform Your Institution?"

import { Link } from "react-router-dom";
import { CalendarDays, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import useInView from "../hooks/useInView";

const CtaBanner = () => {
  const { t } = useTranslation("home");
  const [ref, inView] = useInView({ threshold: 0.3 });

  return (
    <section className="nw-cta" id="nw-demo" ref={ref}>
      <div className={`nw-cta__container${inView ? " nw-in" : ""}`}>

        <div className="nw-cta__left">
          <div className="nw-cta__icon" aria-hidden="true">
            <CalendarDays size={28} strokeWidth={1.7} />
          </div>
          <div className="nw-cta__text">
            <h2 className="nw-cta__heading">{t("cta.heading")}</h2>
            <p className="nw-cta__sub">
              {t("cta.sub")}
            </p>
          </div>
        </div>

        <Link to="/contact" className="nw-cta__btn" id="nw-cta-demo-btn">
          {t("cta.button")}
          <ArrowRight size={16} strokeWidth={2.2} />
        </Link>

      </div>
    </section>
  );
};

export default CtaBanner;
