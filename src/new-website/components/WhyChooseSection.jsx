// WhyChooseSection.jsx — New Website Mockup
// Dark band: "A Smarter Way to Manage & Deliver Education" + headline stats

import { useEffect, useRef, useState } from "react";
import { MousePointerClick, TrendingUp, SlidersHorizontal, LifeBuoy } from "lucide-react";

const stats = [
  { id: "nw-stat-institutions", value: 500,   suffix: "+", label: "Institutions" },
  { id: "nw-stat-students",     value: 50000, suffix: "+", label: "Students"     },
  { id: "nw-stat-teachers",     value: 2000,  suffix: "+", label: "Teachers"     },
  { id: "nw-stat-satisfaction", value: 98,    suffix: "%", label: "Satisfaction" },
];

const pills = [
  { id: "nw-why-easy",    label: "Easy to Use",   Icon: MousePointerClick   },
  { id: "nw-why-scale",   label: "Scalable",      Icon: TrendingUp          },
  { id: "nw-why-custom",  label: "Customizable",  Icon: SlidersHorizontal   },
  { id: "nw-why-support", label: "24/7 Support",  Icon: LifeBuoy            },
];

// Counts a number up once the block scrolls into view
const useCountUp = (target, run) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return;
    const duration = 1600;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, run]);

  return value;
};

const StatItem = ({ value, suffix, label, run, id }) => {
  const count = useCountUp(value, run);
  return (
    <div className="nw-why__stat" id={id}>
      <span className="nw-why__stat-value">
        {count.toLocaleString("en-IN")}{suffix}
      </span>
      <span className="nw-why__stat-label">{label}</span>
    </div>
  );
};

const WhyChooseSection = () => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No IntersectionObserver (or reduced motion) → just show the final numbers
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="nw-why" id="nw-why" ref={ref}>
      <div className="nw-why__glow nw-why__glow--1" aria-hidden="true" />
      <div className="nw-why__glow nw-why__glow--2" aria-hidden="true" />

      <div className="nw-why__container">

        {/* LEFT — copy */}
        <div className="nw-why__left">
          <span className="nw-why__label">WHY CHOOSE EDDVA?</span>
          <h2 className="nw-why__heading">
            A Smarter Way to<br />
            Manage &amp; Deliver Education
          </h2>
          <p className="nw-why__desc">
            EDDVA helps institutions save time, improve learning outcomes
            and build a stronger academic environment.
          </p>

          <div className="nw-why__pills">
            {pills.map(({ id, label, Icon }) => (
              <span className="nw-why__pill" key={id} id={id}>
                <Icon size={16} strokeWidth={1.8} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT — stats */}
        <div className="nw-why__stats" id="nw-why-stats">
          {stats.map(stat => (
            <StatItem key={stat.id} {...stat} run={inView} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyChooseSection;
