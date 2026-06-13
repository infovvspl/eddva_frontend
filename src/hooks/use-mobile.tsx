import * as React from "react";

const MOBILE_BREAKPOINT = 768;
/** Phone + tablet (below Tailwind `lg`) — use to reduce heavy effects on smaller viewports */
const COMPACT_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

/** True for viewports below `lg` (phones and tablets) — for pausing infinite animations, etc. */
export function useIsCompactLayout() {
  const [compact, setCompact] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth < COMPACT_BREAKPOINT
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${COMPACT_BREAKPOINT - 1}px)`);
    const onChange = () => setCompact(window.innerWidth < COMPACT_BREAKPOINT);
    mql.addEventListener("change", onChange);
    setCompact(window.innerWidth < COMPACT_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return compact;
}

const LAPTOP_MIN = 1024;
const LAPTOP_MAX = 1536;

/** True for viewports between `lg` and `2xl` (laptops, typically 1366×768) */
export function useIsLaptop() {
  const [isLaptop, setIsLaptop] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth >= LAPTOP_MIN && window.innerWidth < LAPTOP_MAX
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${LAPTOP_MIN}px) and (max-width: ${LAPTOP_MAX - 1}px)`);
    const onChange = () => setIsLaptop(window.innerWidth >= LAPTOP_MIN && window.innerWidth < LAPTOP_MAX);
    mql.addEventListener("change", onChange);
    setIsLaptop(window.innerWidth >= LAPTOP_MIN && window.innerWidth < LAPTOP_MAX);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isLaptop;
}
