import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface BreadcrumbContextValue {
  /** Label a page wants on its own (last) crumb, e.g. a course or material title. */
  lastLabel?: string;
  setLastLabel: (label?: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({ setLastLabel: () => {} });

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [lastLabel, setLastLabel] = useState<string | undefined>();
  const value = useMemo(() => ({ lastLabel, setLastLabel }), [lastLabel]);
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

export const useBreadcrumbLabel = () => useContext(BreadcrumbContext).lastLabel;

/**
 * Call from a detail page once its real name is known so the trail shows
 * "Classes > Physics Batch" instead of "Classes > Course". Clears on unmount.
 */
export function useSetBreadcrumbLabel(label?: string | null) {
  const { setLastLabel } = useContext(BreadcrumbContext);
  useEffect(() => {
    setLastLabel(label || undefined);
    return () => setLastLabel(undefined);
  }, [label, setLastLabel]);
}
