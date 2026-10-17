import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function initialsOf(name?: string | null) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "U"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

interface UserAvatarProps extends Omit<React.ComponentProps<typeof Button>, "children"> {
  src?: string | null
  name?: string | null
}

/**
 * The one avatar trigger used in every dashboard header: shadcn Avatar inside a
 * ghost, round icon Button (shadcn "avatar dropdown" pattern). No status dot.
 * Pass onClick / aria-* to make it open a menu.
 */
export const UserAvatar = React.forwardRef<HTMLButtonElement, UserAvatarProps>(
  ({ src, name, className, ...props }, ref) => (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="icon"
      aria-label="User menu"
      className={cn("size-8 shrink-0 rounded-full", className)}
      {...props}
    >
      <Avatar className="size-8">
        <AvatarImage src={src || undefined} alt={name || "User"} />
        <AvatarFallback className="text-[11px] font-semibold">{initialsOf(name)}</AvatarFallback>
      </Avatar>
    </Button>
  ),
)
UserAvatar.displayName = "UserAvatar"
