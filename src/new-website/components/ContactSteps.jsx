// ContactSteps.jsx — /contact
// "What happens next" — the four steps between sending the form and going
// live, so nobody has to wonder what they just signed up for.
//
// NOTE: this copy is new and has not been signed off. Check the promised
// response time against what the team actually commits to.

import { Send, PhoneCall, MonitorPlay, Rocket } from "lucide-react";
import { useTranslation } from "react-i18next";
import useInView from "../hooks/useInView";

const steps = [
  {
    id: "nw-step-send",
    Icon: Send,
  },
  {
    id: "nw-step-call",
    Icon: PhoneCall,
  },
  {
    id: "nw-step-demo",
    Icon: MonitorPlay,
  },
  {
    id: "nw-step-live",
    Icon: Rocket,
  },
];

const ContactSteps = () => {
  const { t } = useTranslation("contact");
  const [ref, inView] = useInView({ threshold: 0.25 });

  return (
    <section className="nw-steps" id="nw-contact-steps">
      <div className="nw-steps__container">

        <h2 className="nw-steps__heading">{t("steps.heading")}</h2>

        <ol className={`nw-steps__list${inView ? " nw-in" : ""}`} ref={ref}>
          {steps.map(({ id, Icon }, i) => (
            <li className="nw-steps__step" key={id} id={id} style={{ "--i": i }}>
              <span className="nw-steps__marker" aria-hidden="true">
                <span className="nw-steps__icon">
                  <Icon size={20} strokeWidth={1.9} />
                </span>
                <span className="nw-steps__num">{i + 1}</span>
              </span>
              <h3 className="nw-steps__title">{t(`steps.items.${id}.title`)}</h3>
              <p className="nw-steps__desc">{t(`steps.items.${id}.desc`)}</p>
            </li>
          ))}
        </ol>

      </div>
    </section>
  );
};

export default ContactSteps;
