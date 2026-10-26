import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Camera, type LucideIcon } from "lucide-react"

import { AvatarUploadPopover } from "@/components/ui/avatar-upload-popover"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface UserMenuItem {
  label: string
  icon?: LucideIcon
  /** navigate here on select */
  to?: string
  onSelect?: () => void
  destructive?: boolean
  /** render a separator above this item */
  separator?: boolean
}

interface UserMenuProps {
  src?: string | null
  name?: string | null
  /** small muted line under the name, e.g. "Super Admin" */
  role?: string
  items: UserMenuItem[]
  /** when set, adds a "Change photo" item that opens the upload drawer */
  onUploadPhoto?: (file: File) => Promise<unknown>
  className?: string
}

/**
 * The dashboard profile menu (shadcn avatar dropdown): avatar trigger, compact
 * menu with name/role header, items, and a red destructive entry for logout.
 */
export function UserMenu({ src, name, role, items, className, onUploadPhoto }: UserMenuProps) {
  const navigate = useNavigate()
  const [uploadOpen, setUploadOpen] = React.useState(false)

  return (
    <AvatarUploadPopover open={uploadOpen} onOpenChange={setUploadOpen} onUpload={onUploadPhoto ?? (async () => {})}>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <UserAvatar src={src} name={name} className={className} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 font-medium">
        {(name || role) && (
          <>
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-semibold leading-none">{name}</p>
              {role && <p className="mt-1 truncate text-xs capitalize text-muted-foreground">{role}</p>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuGroup>
          {onUploadPhoto && (
            <DropdownMenuItem className="cursor-pointer" onSelect={() => setTimeout(() => setUploadOpen(true), 60)}>
              <Camera className="mr-2 size-4" />
              Change photo
            </DropdownMenuItem>
          )}
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <React.Fragment key={`${item.label}-${i}`}>
                {item.separator && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  className={item.destructive ? "cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500" : "cursor-pointer"}
                  onSelect={() => (item.to ? navigate(item.to) : item.onSelect?.())}
                >
                  {Icon && <Icon className="mr-2 size-4" />}
                  {item.label}
                </DropdownMenuItem>
              </React.Fragment>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
    </AvatarUploadPopover>
  )
}
