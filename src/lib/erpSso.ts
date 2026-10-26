import { mintErpSsoToken } from "./api/auth";

/**
 * Hands the current school user off to the ERP frontend: mints a short-lived
 * bridge token server-side, then does a full-page navigation to the ERP
 * app's /sso landing route, passing the token in the URL fragment (never
 * sent to a server, never written to logs) exactly like the existing
 * per-module ERP tile hand-off in ERPWorkspace.jsx does.
 */
export async function openErp(path = "/dashboard"): Promise<void> {
  const { token } = await mintErpSsoToken();
  const erpFrontendUrl = import.meta.env.VITE_ERP_FRONTEND_URL || "http://localhost:5173";
  const targetUrl = `${erpFrontendUrl}/sso#token=${encodeURIComponent(token)}&next=${encodeURIComponent(path)}`;
  window.location.href = targetUrl;
}
