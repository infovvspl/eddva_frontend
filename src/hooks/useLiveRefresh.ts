import { useEffect, useRef } from 'react';

type RefreshFn = () => void | Promise<void>;

/** Returning to a tab fires both `focus` and `visibilitychange`; one refresh is enough. */
const MIN_GAP_MS = 1000;

export default function useLiveRefresh(
  refreshFn: RefreshFn,
  deps: React.DependencyList = [],
  intervalMs = 30000
) {
  const refreshRef = useRef(refreshFn);
  refreshRef.current = refreshFn;

  useEffect(() => {
    let active = true;
    let inFlight = false;
    let rerunWhenDone = false;
    let lastStartedAt = 0;

    const run = () => {
      inFlight = true;
      lastStartedAt = Date.now();
      Promise.resolve()
        .then(() => refreshRef.current())
        .catch((error) => console.error('useLiveRefresh: refresh failed', error))
        .finally(() => {
          inFlight = false;
          if (rerunWhenDone && active) {
            rerunWhenDone = false;
            run();
          }
        });
    };

    // While a refresh is running, a focus or timer trigger is simply dropped (the
    // running refresh already covers it). A data-changed trigger is not: the change may
    // have happened after that refresh started, so it reruns once when this one ends.
    const trigger = ({ force = false } = {}) => {
      if (!active) return;
      if (inFlight) {
        if (force) rerunWhenDone = true;
        return;
      }
      if (!force && Date.now() - lastStartedAt < MIN_GAP_MS) return;
      run();
    };

    const onFocus = () => trigger();
    const onDataChanged = () => trigger({ force: true });
    const onVisibility = () => {
      if (document.visibilityState === 'visible') trigger();
    };
    // The timer never wakes a tab nobody is looking at.
    const onTimer = () => {
      if (document.visibilityState === 'hidden' || inFlight) return;
      trigger();
    };

    trigger({ force: true });

    window.addEventListener('focus', onFocus);
    window.addEventListener('eddva:data-changed', onDataChanged as EventListener);
    document.addEventListener('visibilitychange', onVisibility);

    const timer = window.setInterval(onTimer, intervalMs);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('eddva:data-changed', onDataChanged as EventListener);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, deps);
}
