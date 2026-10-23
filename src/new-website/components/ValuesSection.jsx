// ValuesSection.jsx — /about — "Our Values"

import { useTranslation } from "react-i18next";
import { useLocalized } from "@/i18n/useLocalized";
import { values as valuesData } from "../data/values";
import useInView from "../hooks/useInView";

const ValuesSection = () => {
  const { t } = useTranslation("about");
  const values = useLocalized("data-values", valuesData);
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section className="nw-values" id="nw-values">
      <div className="nw-values__container">

        <header className="nw-values__header">
          <h2 className="nw-values__heading">{t("values.heading")}</h2>
          <p className="nw-values__sub">{t("values.sub")}</p>
        </header>

        <ul className={`nw-values__grid${inView ? " nw-in" : ""}`} ref={ref}>
          {values.map(({ id, title, desc, Icon, color, bg }, i) => (
            <li
              className="nw-values__card"
              key={id} id={id}
              style={{ "--nw-i": i, "--nw-value-accent": color }}
            >
              <span className="nw-values__watermark" aria-hidden="true">
                <Icon size={92} strokeWidth={1.3} />
              </span>
              <span className="nw-values__icon" style={{ background: bg, color }} aria-hidden="true">
                <Icon size={24} strokeWidth={1.8} />
              </span>
              <h3 className="nw-values__title">{title}</h3>
              <p className="nw-values__desc">{desc}</p>
            </li>
          ))}
        </ul>

      </div>
    </section>
  );
};

export default ValuesSection;
