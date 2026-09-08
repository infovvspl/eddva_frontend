import { useEffect } from "react";

// Every sub-page scrolls to (0, 0) on mount so a route change never leaves
// the reader mid-scroll on the previous page. That unconditional scrollTo
// also fights the browser's native "jump to the #hash element" behaviour —
// which never fires anyway for a client-side route change (only a hard page
// load or a same-document anchor click does that natively) — so a link like
// "/solution/institutions#nw-svc-schools" always lands at the top of the
// page instead of at that section.
//
// This does the same top-of-page reset when there is no hash, and otherwise
// waits a tick for the target section to be in the DOM (it renders on the
// same pass, but scrollIntoView needs layout to have happened) before
// scrolling to it. `scroll-margin-top` on the section itself keeps the fixed
// navbar from covering its heading.
const useScrollToTopOrHash = () => {
  useEffect(() => {
    const { hash } = window.location;
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, []);
};

export default useScrollToTopOrHash;
