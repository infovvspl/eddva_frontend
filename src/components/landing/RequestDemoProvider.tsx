import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import RequestDemoModal from './RequestDemoModal';
import type { LeadVertical } from '@/lib/api/leads';

interface RequestDemoContextValue {
  /** Open the "Request a Demo" modal, optionally preselecting School/Coaching. */
  openRequestDemo: (vertical?: LeadVertical) => void;
}

const RequestDemoContext = createContext<RequestDemoContextValue | null>(null);

/**
 * Renders the RequestDemoModal once and exposes `openRequestDemo()` to any
 * descendant CTA (Hero, Features, footer, etc.). Wrap the landing shell in this.
 */
export function RequestDemoProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [vertical, setVertical] = useState<LeadVertical>('SCHOOL');

  const openRequestDemo = useCallback((v?: LeadVertical) => {
    if (v) setVertical(v);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openRequestDemo }), [openRequestDemo]);

  return (
    <RequestDemoContext.Provider value={value}>
      {children}
      <RequestDemoModal open={open} onOpenChange={setOpen} defaultVertical={vertical} />
    </RequestDemoContext.Provider>
  );
}

/** Access `openRequestDemo()`. No-ops safely if used outside the provider. */
export function useRequestDemo(): RequestDemoContextValue {
  const ctx = useContext(RequestDemoContext);
  return ctx ?? { openRequestDemo: () => undefined };
}
