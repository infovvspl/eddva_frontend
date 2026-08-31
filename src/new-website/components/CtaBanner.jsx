// CtaBanner.jsx — New Website Mockup
// Violet band: "Ready to Transform Your Institution?"

import { CalendarDays, ArrowRight } from "lucide-react";

const CtaBanner = () => {
  return (
    <section className="nw-cta" id="nw-demo">
      <div className="nw-cta__container">

        <div className="nw-cta__left">
          <div className="nw-cta__icon" aria-hidden="true">
            <CalendarDays size={28} strokeWidth={1.7} />
          </div>
          <div className="nw-cta__text">
            <h2 className="nw-cta__heading">Ready to Transform Your Institution?</h2>
            <p className="nw-cta__sub">
              Book a free demo and explore how EDDVA can help you achieve more.
            </p>
          </div>
        </div>

        <a href="#nw-contact" className="nw-cta__btn" id="nw-cta-demo-btn">
          Book a Free Demo
          <ArrowRight size={16} strokeWidth={2.2} />
        </a>

      </div>
    </section>
  );
};

export default CtaBanner;
