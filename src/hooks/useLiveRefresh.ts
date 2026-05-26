import { useEffect, useRef } from 'react';

type RefreshFn = () => void | Promise<void>;

export default function useLiveRefresh(
  refreshFn: RefreshFn,
  deps: React.DependencyList = [],
  intervalMs = 30000
) {
  const refreshRef = useRef(refreshFn);

  useEffect(() => {
    refreshRef.current = refreshFn;
  }, [refreshFn]);

  useEffect(() => {
    let active = true;

    const runRefresh = () => {
      if (!active) return;
      void refreshRef.current();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runRefresh();
      }
    };

    runRefresh();

    window.addEventListener('focus', runRefresh);
    window.addEventListener('eddva:data-changed', runRefresh as EventListener);
    document.addEventListener('visibilitychange', handleVisibility);

    const timer = window.setInterval(runRefresh, intervalMs);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', runRefresh);
      window.removeEventListener('eddva:data-changed', runRefresh as EventListener);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, deps);
}
