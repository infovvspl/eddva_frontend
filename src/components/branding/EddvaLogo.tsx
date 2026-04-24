import * as React from "react";
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/eddva-logo.svg";

/** Canonical EDDVA wordmark — use in nav, footer, dashboard, and auth pages */
export function EddvaLogo({
  className,
  alt = "EDDVA",
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img src={logoUrl} alt={alt} className={cn("object-contain", className)} {...props} />;
}
