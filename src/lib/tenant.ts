/**
 * Subdomain detection and tenant resolution utilities.
 *
 * In production:  iit.edva.in  → subdomain = "iit"
 * In development: iit.localhost → subdomain = "iit"
 * Fallback:       localhost     → reads stored subdomain from localStorage
 */

const MAIN_DOMAINS = ["localhost", "edva.in", "www"];
const SUBDOMAIN_STORAGE_KEY = "eddva_tenant_subdomain";

/** Persist the tenant subdomain after login so bare-localhost dev works correctly */
export function storeSubdomain(subdomain: string | null | undefined): void {
  if (subdomain) {
    localStorage.setItem(SUBDOMAIN_STORAGE_KEY, subdomain);
  }
}

/** Clear stored subdomain on logout */
export function clearStoredSubdomain(): void {
  localStorage.removeItem(SUBDOMAIN_STORAGE_KEY);
}

/** Extract subdomain from current hostname, or null if on the main domain */
export function getSubdomain(): string | null {
  const hostname = window.location.hostname; // e.g. "iit.localhost" or "iit.edva.in"

  // IP addresses (IPv4) are never tenant subdomains
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;

  const parts = hostname.split(".");

  // iit.localhost → subdomain = "iit"
  if (parts.length === 2 && parts[1] === "localhost") {
    return parts[0];
  }

  // iit.edva.in → subdomain = "iit"
  if (parts.length >= 3) {
    const sub = parts[0];
    if (MAIN_DOMAINS.includes(sub)) return null;
    return sub;
  }

  // bare localhost — fall back to stored subdomain (set after login)
  if (parts.length === 1 && parts[0] === "localhost") {
    return localStorage.getItem(SUBDOMAIN_STORAGE_KEY) ?? null;
  }

  return null;
}

/** Check if we're on a tenant subdomain */
export function isTenantSubdomain(): boolean {
  return getSubdomain() !== null;
}
