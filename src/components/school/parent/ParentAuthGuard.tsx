import { Loader2 } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/SchoolAuthContext";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { parentClient } from "@/lib/api/parent-client";

/** A child (student) linked to the logged-in parent. */
export interface ParentChild {
  id: string;
  name?: string | null;
  className?: string | null;
  section?: string | null;
  rollNumber?: string | null;
  admissionNo?: string | null;
}

interface ParentContextType {
  activeChildId: string | null;
  setActiveChildId: (id: string) => void;
  children: ParentChild[];
  childrenLoading: boolean;
  childrenError: boolean;
  refetchChildren: () => void;
}

const ParentContext = createContext<ParentContextType>({
  activeChildId: null,
  setActiveChildId: () => {},
  children: [],
  childrenLoading: false,
  childrenError: false,
  refetchChildren: () => {},
});

export const useParentContext = () => useContext(ParentContext);

export function ParentAuthGuard({ children: componentChildren }: { children?: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [childrenError, setChildrenError] = useState(false);

  const loadChildren = useCallback(() => {
    setContextLoading(true);
    setChildrenError(false);
    parentClient
      .getChildren()
      .then((data) => {
        // Defensive: the API must return an array. Anything else is treated as empty.
        const list: ParentChild[] = Array.isArray(data) ? (data as ParentChild[]) : [];
        setChildren(list);
        setActiveChildId((current) => current ?? (list.length > 0 ? list[0].id : null));
      })
      .catch(() => {
        // parentClient already logged full error detail to the console.
        setChildren([]);
        setChildrenError(true);
      })
      .finally(() => setContextLoading(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === "PARENT") {
      loadChildren();
    } else {
      setContextLoading(false);
    }
  }, [isAuthenticated, user?.id, user?.role, loadChildren]);

  if (loading || contextLoading) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "PARENT") {
    return <Navigate to="/login" replace />;
  }

  return (
    <ParentContext.Provider
      value={{
        activeChildId,
        setActiveChildId,
        children,
        childrenLoading: contextLoading,
        childrenError,
        refetchChildren: loadChildren,
      }}
    >
      {componentChildren || <Outlet />}
    </ParentContext.Provider>
  );
}
