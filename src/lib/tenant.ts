/**
 * Subdomain detection and tenant resolution utilities.
 *
 * In production:  iit.edva.in  → subdomain = "iit"
 * In development: iit.localhost → subdomain = "iit"
 */

const MAIN_DOMAINS = ["localhost", "edva.in", "www"];

/** Extract subdomain from current hostname, or null if on the main domain */
export function getSubdomain(): string | null {
  const hostname = window.location.hostname; // e.g. "iit.localhost" or "iit.edva.in"

  // IP addresses (IPv4) are never tenant subdomains
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;

  const parts = hostname.split(".");

  // localhost → no subdomain
  if (parts.length === 1) return null;

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

  return null;
}

/** Check if we're on a tenant subdomain */
export function isTenantSubdomain(): boolean {
  return getSubdomain() !== null;
}
