import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, extractData } from "@/lib/api/client";
import { useAuth } from "@/context/SchoolAuthContext";
import type { SchoolLoginResponse } from "@/lib/api/auth";

const BACKSLASH = String.fromCharCode(92);

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes(BACKSLASH)) {
    return "/school/admin";
  }
  return next;
}

interface SsoLink {
  token: string;
  next: string;
}

function readSsoLink(): SsoLink | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const token = params.get("token")?.trim();
  if (!token) return null;
  return { token, next: safeNextPath(params.get("next")) };
}

function extractErrorMessage(err: unknown): string {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message ?? "Sign-in failed";
}

/**
 * Landing page for the ERP → LMS switch (the reverse of ERP's own /sso page).
 * ERP opens `/school/sso#token=<bridge-jwt>&next=<path>` when an Institute
 * Admin uses the "Switch to LMS" control. The token travels in the URL
 * fragment, never sent to a server or written to logs — this page exchanges
 * it server-side via POST /school/auth/sso for a real LMS session.
 */
export default function SchoolSsoLanding() {
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();
  const [link] = useState(readSsoLink);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
    if (!link) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.post("/school/auth/sso", { token: link.token });
        const data = extractData<SchoolLoginResponse>(res);
        if (cancelled) return;

        setAuthSession({
          token: data.token,
          user: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role.toUpperCase() as any,
            phone: data.user.phone,
            instituteId: data.user.instituteId,
            studentProfile: data.user.studentProfile as any,
          },
          institute: data.institute
            ? {
                id: data.institute.id,
                name: data.institute.name,
                logo: data.institute.logo ?? null,
                tenantDomain: data.institute.tenantDomain ?? null,
                erpEnabled: (data.institute as any).erpEnabled ?? true,
                lmsEnabled: (data.institute as any).lmsEnabled ?? true,
              }
            : null,
        });
        navigate(link.next, { replace: true });
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [link, navigate, setAuthSession]);

  if (!link || error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-900">Could not sign you in</p>
          <p className="mt-2 text-sm text-slate-600">
            {error ?? "This sign-in link is missing or invalid. Please switch from ERP again."}
          </p>
          <button
            type="button"
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            onClick={() => navigate("/login", { replace: true })}
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Signing you in…</div>;
}
