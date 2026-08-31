// FaqSection.jsx — New Website Mockup
// Two-column accordion. Only one answer is open at a time.

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    id: "nw-faq-what",
    q: "What is EDDVA?",
    a: "EDDVA is an all-in-one AI-powered platform for schools and institutes. It brings together a learning management system, a full ERP and analytics so academics, administration and communication live in one place.",
  },
  {
    id: "nw-faq-secure",
    q: "Is my data secure?",
    a: "Yes. EDDVA is ISO 27001:2022 certified and uses encryption in transit and at rest, role-based access control and regular backups. Your institution's data is never shared with third parties.",
  },
  {
    id: "nw-faq-who",
    q: "Which institutions can use EDDVA?",
    a: "Schools, colleges, coaching centres and competitive-exam institutes. Modules can be switched on or off so a 200-student school and a 20,000-student group both get a setup that fits.",
  },
  {
    id: "nw-faq-custom",
    q: "Can EDDVA be customized?",
    a: "Absolutely. Branding, report formats, fee structures, grading schemes and workflows are all configurable, and our team can build institution-specific modules on request.",
  },
  {
    id: "nw-faq-training",
    q: "Is training provided?",
    a: "Every rollout includes onboarding sessions for administrators, teachers and parents, plus recorded walkthroughs, documentation and 24/7 support after go-live.",
  },
  {
    id: "nw-faq-start",
    q: "How can I get started?",
    a: "Book a free demo. We'll walk through your requirements, show the modules that matter to you and set up a pilot environment for your institution — usually within a week.",
  },
];

const FaqSection = () => {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId(prev => (prev === id ? null : id));

  return (
    <section className="nw-faq" id="nw-faq">
      <div className="nw-faq__container">

        <div className="nw-faq__header">
          <span className="nw-faq__label">FAQS</span>
          <h2 className="nw-faq__heading">Frequently Asked Questions</h2>
        </div>

        <div className="nw-faq__grid">
          {faqs.map(({ id, q, a }) => {
            const open = openId === id;
            return (
              <div className={`nw-faq__item${open ? " nw-open" : ""}`} key={id} id={id}>
                <button
                  className="nw-faq__question"
                  id={`${id}-btn`}
                  aria-expanded={open}
                  aria-controls={`${id}-answer`}
                  onClick={() => toggle(id)}
                >
                  <span>{q}</span>
                  <ChevronDown
                    size={18}
                    strokeWidth={2}
                    className="nw-faq__chevron"
                  />
                </button>
                <div
                  className="nw-faq__answer"
                  id={`${id}-answer`}
                  role="region"
                  aria-labelledby={`${id}-btn`}
                >
                  <p>{a}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FaqSection;
