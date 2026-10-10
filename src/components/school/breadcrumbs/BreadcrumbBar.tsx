import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { buildTrail, isTrailHidden } from './trail';
import { portalForPath } from './portals';
import { useBreadcrumbLabel } from './BreadcrumbContext';

/**
 * Back button + hierarchical trail shown above every school-portal page. Back
 * goes to the parent level (not browser history) so it always moves one step
 * up the hierarchy, whether the user arrived from the sidebar, a card or a link.
 */
export default function BreadcrumbBar() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const lastLabel = useBreadcrumbLabel();

  const portal = portalForPath(pathname);
  if (!portal || isTrailHidden(portal, pathname)) return null;

  const crumbs = buildTrail(portal, pathname, new URLSearchParams(search), lastLabel);
  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : undefined;

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-white/70 px-4 py-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 sm:px-6">
      {parent?.to && (
        <button
          type="button"
          onClick={() => navigate(parent.to!)}
          aria-label={`Back to ${parent.label}`}
          title={`Back to ${parent.label}`}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <ArrowLeft size={15} />
        </button>
      )}
      <Breadcrumb className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <BreadcrumbList className="flex-nowrap text-xs font-semibold sm:text-sm">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <React.Fragment key={`${i}-${crumb.label}`}>
                <BreadcrumbItem>
                  {isLast || !crumb.to ? (
                    <BreadcrumbPage className="max-w-[220px] truncate font-bold text-slate-800 dark:text-slate-100" title={crumb.label}>
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.to} className="transition-colors hover:text-blue-600">
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
