/**
 * Portal-agnostic breadcrumb engine. Each school portal (student, admin,
 * teacher, super-admin) supplies a PortalConfig; the trail is derived from the
 * URL so pages get hierarchical navigation without wiring their own.
 * Labels reuse the sidebar's names. Pages that know a better name for a
 * dynamic segment (a course title, a material title) override the last crumb
 * through the breadcrumb context.
 */
export interface Crumb {
  label: string;
  /** Absent on the current (last) crumb. */
  to?: string;
}

export interface PortalConfig {
  /** URL prefix of the portal, e.g. /school/student. */
  base: string;
  /** First crumb; links to `base`. */
  rootLabel: string;
  /** Label for a segment, e.g. "students" -> "Students". */
  segmentLabels: Record<string, string>;
  /** Whole relative paths whose label differs from the plain segment label. */
  pathLabels?: Record<string, string>;
  /** Default label for an id-like segment, keyed by the segment before it. */
  dynamicLabels?: Record<string, string>;
  /** URL plumbing segments that are not a page a user can land on. */
  skipped?: string[];
  /** Pages that conceptually sit under another module: first segment -> module segment. */
  parentModule?: Record<string, string>;
  /** Relative paths of full-screen experiences that must not show the bar. */
  hidden?: RegExp[];
  /** Extra crumbs kept in the query string (e.g. subject > chapter > topic). */
  queryTrail?: (segments: string[], search: URLSearchParams, base: string) => Crumb[];
}

export function relativePath(config: PortalConfig, pathname: string): string {
  return pathname.replace(config.base, '').replace(/^\/+|\/+$/g, '');
}

export function isTrailHidden(config: PortalConfig, pathname: string): boolean {
  const rel = relativePath(config, pathname);
  return rel === '' || (config.hidden ?? []).some((re) => re.test(rel));
}

export function buildTrail(
  config: PortalConfig,
  pathname: string,
  search: URLSearchParams,
  lastLabelOverride?: string,
): Crumb[] {
  const rel = relativePath(config, pathname);
  const crumbs: Crumb[] = [{ label: config.rootLabel, to: config.base }];
  if (!rel) return crumbs;

  const segments = rel.split('/');
  const skipped = new Set(config.skipped ?? []);

  const parentKey = config.parentModule?.[segments[0]];
  if (parentKey && config.segmentLabels[parentKey]) {
    crumbs.push({ label: config.segmentLabels[parentKey], to: `${config.base}/${parentKey}` });
  }

  segments.forEach((seg, i) => {
    if (skipped.has(seg)) return;
    const key = segments.slice(0, i + 1).join('/');
    const known = config.pathLabels?.[key] ?? config.segmentLabels[seg];
    const label = known ?? config.dynamicLabels?.[segments[i - 1]] ?? 'Details';
    crumbs.push({ label, to: `${config.base}/${key}` });
  });

  if (config.queryTrail) crumbs.push(...config.queryTrail(segments, search, config.base));

  const last = crumbs[crumbs.length - 1];
  if (lastLabelOverride) last.label = lastLabelOverride;
  delete last.to; // the current page is not a link
  return crumbs;
}
