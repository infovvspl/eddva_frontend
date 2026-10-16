import { Fragment, Suspense, useMemo, type ReactNode } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { AppSidebar, type AppSidebarProps } from "@/components/app-sidebar"
import { isNavItemActive, type NavGroup } from "@/components/nav-main"
import { PageErrorBoundary } from "@/components/shared/PageErrorBoundary"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type SuperAdminShellProps = Pick<
  AppSidebarProps,
  "brand" | "groups"
> & {
  /** Label for the first breadcrumb, which links to the portal's dashboard. */
  rootLabel: string
  /** Pages that manage their own padding and layout (lists, chat, live rooms). */
  isFullWidthPage: (pathname: string) => boolean
  /** Right side of the default header (bell, profile menu, ...). */
  headerActions?: ReactNode
  /** Replaces the whole default header. The sidebar toggle is not included, add <SidebarTrigger /> if you need it. */
  header?: ReactNode
  /** Phone-only bar fixed to the bottom; the page area leaves room for it. */
  mobileBar?: ReactNode
}

type Crumb = { label: string; to?: string }

/** Best-matching menu entry (longest URL wins) → "Root / Group / Page [/ Details]". */
function buildCrumbs(
  pathname: string,
  groups: NavGroup[],
  rootLabel: string,
  rootUrl: string,
): Crumb[] {
  let best: { heading: string; title: string; url: string } | null = null
  for (const group of groups) {
    for (const item of group.items) {
      if (!isNavItemActive(pathname, item)) continue
      if (!best || item.url.length > best.url.length) {
        best = { heading: group.heading, title: item.title, url: item.url }
      }
    }
  }

  const crumbs: Crumb[] = [{ label: rootLabel, to: rootUrl }]
  if (!best || best.url === rootUrl) return crumbs
  crumbs.push({ label: best.heading })
  crumbs.push({ label: best.title, to: best.url })
  if (pathname !== best.url) crumbs.push({ label: "Details" })
  return crumbs
}

export function SuperAdminShell({
  brand,
  groups,
  rootLabel,
  isFullWidthPage,
  headerActions,
  header,
  mobileBar,
}: SuperAdminShellProps) {
  const { pathname } = useLocation()
  const crumbs = useMemo(
    () => buildCrumbs(pathname, groups, rootLabel, brand.to),
    [pathname, groups, rootLabel, brand.to],
  )
  const fullWidth = isFullWidthPage(pathname)

  return (
    // The page area scrolls, not the window: pages such as chat and live rooms size themselves to the viewport.
    <SidebarProvider className="h-svh max-h-svh overflow-hidden">
      <AppSidebar brand={brand} groups={groups} />
      <SidebarInset className="min-h-0 overflow-hidden">
        {header ?? (
        <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex min-w-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {crumbs.map((crumb, i) => {
                  const last = i === crumbs.length - 1
                  return (
                    <Fragment key={`${crumb.label}-${i}`}>
                      <BreadcrumbItem className={cn(!last && "hidden md:block")}>
                        {last || !crumb.to ? (
                          last ? (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          ) : (
                            <span>{crumb.label}</span>
                          )
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.to}>{crumb.label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!last && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {headerActions && <div className="shrink-0 pr-4">{headerActions}</div>}
        </header>
        )}
        <main
          data-tour="main-content"
          className={cn(
            "relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain custom-scrollbar",
            mobileBar && "pb-20 md:pb-0",
          )}
        >
          <div
            className={cn(
              "w-full",
              fullWidth ? "p-0" : "px-3 py-4 sm:px-4 lg:px-6 lg:py-6",
            )}
          >
            <PageErrorBoundary>
              <Suspense
                fallback={
                  <div className="flex h-[50vh] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            </PageErrorBoundary>
          </div>
        </main>
      </SidebarInset>
      {mobileBar}
    </SidebarProvider>
  )
}
