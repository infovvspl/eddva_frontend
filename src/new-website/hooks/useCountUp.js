// useCountUp.js — New Website Mockup
// Counts from 0 to `target` once `active` turns true, on requestAnimationFrame
// with an ease-out curve. Jumps straight to the target when the visitor has
// asked for reduced motion.

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./useInView";

export default function useCountUp(target, active, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    if (prefersReducedMotion() || typeof requestAnimationFrame === "undefined") {
      setValue(target);
      return undefined;
    }

    let frame;
    const started = performance.now();
    const tick = now => {
      const progress = Math.min((now - started) / duration, 1);
      // easeOutCubic
      setValue(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);

  return value;
}
