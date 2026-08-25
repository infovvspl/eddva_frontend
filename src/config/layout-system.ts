/**
 * Semantic Page Layout System
 * Enterprise Layout Architecture Engine for Eddva School ERP
 *
 * Supported Layout Categories:
 * - 'dashboard': High-density executive/student overview pages. Consumes .erp-dashboard-container
 *                (fills available space with a generous, readable max-width bounds of 1920px on 3XL and 2560px on 4XL).
 * - 'workspace': Interactive tools, split-view planners, timetables, and calendars. Consumes .erp-workspace-container.
 * - 'immersive': Fixed-viewport interactive experiences (e.g. video live player, test engine, real-time chat).
 * - 'content': Standard forms, data tables, profile, and settings pages (bounded within .erp-container max-width).
 */

export type PageLayoutType = 'dashboard' | 'workspace' | 'immersive' | 'content';

export interface PageLayoutConfig {
  type: PageLayoutType;
  container: string;
  padding: string;
  spacing: string;
  scroll: boolean;
  maxWidth: string;
  // Legacy compatibility getters
  mainPaddingClass: string;
  containerClass: string;
  isScrollable: boolean;
}

export interface RouteLayoutMetadata {
  layout?: PageLayoutType;
  scrollable?: boolean;
}

/**
 * Centralized Route Layout Metadata Registry.
 * Decouples layout selection from URL path string logic.
 */
const ROUTE_LAYOUT_REGISTRY: Map<string, PageLayoutType> = new Map<string, PageLayoutType>([
  // Dashboards
  ['/school/student', 'dashboard'],
  ['/school/student/', 'dashboard'],
  ['/school/admin', 'dashboard'],
  ['/school/admin/', 'dashboard'],
  ['/school/teacher', 'dashboard'],
  ['/school/teacher/', 'dashboard'],
  ['/school/parent', 'dashboard'],
  ['/school/parent/', 'dashboard'],

  // Workspaces
  ['/school/student/timetable', 'workspace'],
  ['/school/student/calendar', 'workspace'],
  ['/school/student/analytics', 'workspace'],
  ['/school/student/planner', 'workspace'],
  ['/school/student/study-materials', 'workspace'],
  ['/school/student/recorded-classes', 'workspace'],
  ['/school/student/live-classes', 'workspace'],

  // Immersives
  ['/school/student/chat', 'immersive'],
]);

/**
 * Register explicit layout metadata for any route or page module.
 */
export function registerRouteLayout(routePattern: string, layoutType: PageLayoutType): void {
  ROUTE_LAYOUT_REGISTRY.set(routePattern, layoutType);
}

/**
 * Resolve layout category by route handle metadata, registry mapping, or pattern matching.
 */
export function getPageLayoutType(pathname: string, routeHandle?: RouteLayoutMetadata): PageLayoutType {
  // 1. Explicit Route Handle Metadata (highest priority)
  if (routeHandle?.layout) {
    return routeHandle.layout;
  }

  // 2. Route Layout Registry lookup
  const registeredType = ROUTE_LAYOUT_REGISTRY.get(pathname);
  if (registeredType) {
    return registeredType;
  }

  // 3. Dynamic pattern fallback
  if (pathname.includes('/live/') || (pathname.includes('/assessments/') && pathname.includes('/take'))) {
    return 'immersive';
  }

  // 4. Default standard content layout
  return 'content';
}

/**
 * Generate complete layout configuration object for rendering the page shell.
 */
export function getPageLayoutConfig(pathname: string, routeHandle?: RouteLayoutMetadata): PageLayoutConfig {
  const layoutType = getPageLayoutType(pathname, routeHandle);

  switch (layoutType) {
    case 'dashboard': {
      const container = 'erp-dashboard-container';
      const padding = 'p-3 sm:p-5 lg:p-6';
      const scroll = routeHandle?.scrollable ?? true;
      return {
        type: 'dashboard',
        container,
        padding,
        spacing: 'space-y-6',
        scroll,
        maxWidth: '1920px (3XL) / 2560px (4XL)',
        mainPaddingClass: padding,
        containerClass: container,
        isScrollable: scroll,
      };
    }

    case 'workspace': {
      const container = 'erp-workspace-container';
      const padding = 'p-3 sm:p-5 lg:p-6';
      const scroll = routeHandle?.scrollable ?? true;
      return {
        type: 'workspace',
        container,
        padding,
        spacing: 'space-y-5',
        scroll,
        maxWidth: '2000px (3XL) / 2800px (4XL)',
        mainPaddingClass: padding,
        containerClass: container,
        isScrollable: scroll,
      };
    }

    case 'immersive': {
      const isAssessmentTake = pathname.includes('/assessments/') && pathname.includes('/take');
      const scroll = routeHandle?.scrollable ?? (isAssessmentTake ? true : false);
      const container = scroll ? 'w-full h-full overflow-y-auto' : 'w-full h-full overflow-hidden';
      const padding = 'p-0';
      return {
        type: 'immersive',
        container,
        padding,
        spacing: 'space-y-0',
        scroll,
        maxWidth: '100%',
        mainPaddingClass: padding,
        containerClass: container,
        isScrollable: scroll,
      };
    }

    case 'content':
    default: {
      const container = 'h-full w-full erp-container';
      const padding = 'p-3 sm:p-5 lg:p-6';
      const scroll = routeHandle?.scrollable ?? true;
      return {
        type: 'content',
        container,
        padding,
        spacing: 'space-y-6',
        scroll,
        maxWidth: '1800px (3XL) / 2400px (4XL)',
        mainPaddingClass: padding,
        containerClass: container,
        isScrollable: scroll,
      };
    }
  }
}
