export function getTenantDomainFromHostname(hostname = window.location.hostname) {
  const host = hostname.toLowerCase();

  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return null;

  if (host.endsWith('.localhost')) {
    return host.replace(/\.localhost$/, '').split('.')[0] || null;
  }

  const parts = host.split('.');
  return parts.length >= 3 && parts[0] !== 'www' ? parts[0] : null;
}

export function getPortalType(hostname = window.location.hostname) {
  const host = hostname.toLowerCase();

  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return 'SUPER_ADMIN';

  if (host.endsWith('.localhost')) {
    const sub = host.replace(/\.localhost$/, '').split('.')[0] || '';
    if (sub === 'student') return 'STUDENT';
    if (sub === 'parent') return 'PARENT';
    if (sub === 'super-admin' || sub === 'admin') return 'SUPER_ADMIN';
    return 'INSTITUTE';
  }

  const sub = host.split('.')[0] || '';
  if (sub === 'student') return 'STUDENT';
  if (sub === 'parent') return 'PARENT';
  if (sub === 'super-admin' || sub === 'admin') return 'SUPER_ADMIN';
  return 'INSTITUTE';
}

export function getPortalLoginPath(portalType = getPortalType()) {
  if (portalType === 'SUPER_ADMIN') return '/login';
  if (portalType === 'INSTITUTE') return '/login';
  if (portalType === 'STUDENT') return '/login';
  if (portalType === 'PARENT') return '/login';
  return '/login';
}

export function getCurrentTenantDomain() {
  return getTenantDomainFromHostname() || localStorage.getItem('tenantDomain') || null;
}

export function isTenantHost() {
  return Boolean(getTenantDomainFromHostname());
}

export function getBaseAppUrl() {
  const { protocol, hostname, port } = window.location;
  const portPart = port ? `:${port}` : '';

  if (hostname.endsWith('.localhost')) return `${protocol}//localhost${portPart}`;

  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return `${protocol}//${parts.slice(1).join('.')}${portPart}`;
  }

  return `${protocol}//${hostname}${portPart}`;
}

export function formatTenantUrl(tenantDomain) {
  const domain = tenantDomain?.trim();
  if (!domain || typeof window === 'undefined') return null;

  const { protocol, hostname, port } = window.location;
  const portPart = port ? `:${port}` : '';

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
    return `${protocol}//${domain}.localhost${portPart}`;
  }

  const parts = hostname.split('.');
  const baseHost = parts.length >= 3 ? parts.slice(1).join('.') : hostname;
  return `${protocol}//${domain}.${baseHost}${portPart}`;
}

/** Teacher / institute staff login URL for sharing after onboarding */
export function getTenantLoginUrl(tenantDomain) {
  const base = formatTenantUrl(tenantDomain);
  return base ? `${base}/login` : null;
}

export function getTenantTarget(tenantDomain) {
  const target = formatTenantUrl(tenantDomain);
  if (!target) return null;

  const current = `${window.location.protocol}//${window.location.host}`;
  return target === current ? '/' : `${target}/`;
}

function encodePayload(value) {
  const json = JSON.stringify(value ?? null);
  return btoa(unescape(encodeURIComponent(json)));
}

function decodePayload(value) {
  const text = decodeURIComponent(escape(atob(value)));
  return JSON.parse(text);
}

export function buildTenantAuthCompleteUrl(tenantDomain, payload) {
  const base = formatTenantUrl(tenantDomain);
  if (!base) return null;
  const encoded = encodePayload(payload);
  return `${base}/auth/complete?payload=${encodeURIComponent(encoded)}`;
}

export function readTenantAuthPayload(search = window.location.search) {
  const params = new URLSearchParams(search);
  const encoded = params.get('payload');
  if (!encoded) return null;
  try {
    return decodePayload(encoded);
  } catch {
    return null;
  }
}

/** Post-login navigation for merged school_platform routes */
export function finishAuthRedirect(tenantDomain, navigate, role) {
  if (role === 'SUPER_ADMIN') {
    navigate('/super-admin/dashboard', { replace: true });
    return;
  }

  if (role === 'INSTITUTE_ADMIN') {
    navigate('/school/admin', { replace: true });
    return;
  }

  if (role === 'TEACHER') {
    navigate('/school/teacher', { replace: true });
    return;
  }

  if (role === 'STUDENT') {
    navigate('/school/student', { replace: true });
    return;
  }

  if (role === 'PARENT') {
    navigate('/school/parent', { replace: true });
    return;
  }

  navigate('/login', { replace: true });
}
