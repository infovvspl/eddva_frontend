import * as React from "react"
import { Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"

interface AvatarUploadPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Upload the file; reject/throw to show an error. */
  onUpload: (file: File) => Promise<unknown>
  /** The element the popover opens under (a button or the avatar). */
  /** When set (and `hasPhoto`), shows a Remove button. */
  onRemove?: () => Promise<unknown>
  hasPhoto?: boolean
  /** current photo URL, shown as a preview with the Remove action */
  currentSrc?: string | null
  name?: string | null
  children: React.ReactNode
  align?: "start" | "center" | "end"
}

/** "Change photo" popover that opens right under its anchor, shadcn dropdown style. */
export function AvatarUploadPopover({ open, onOpenChange, onUpload, onRemove, hasPhoto, currentSrc, name, children, align = "end" }: AvatarUploadPopoverProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setFile(null)
      setError(null)
    }
  }, [open])

  const submit = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await onUpload(file)
      onOpenChange(false)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Upload failed")
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!onRemove) return
    setBusy(true)
    setError(null)
    try {
      await onRemove()
      onOpenChange(false)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Could not remove photo")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <PopoverAnchor asChild>
        <span className="inline-flex">{children}</span>
      </PopoverAnchor>
      <PopoverContent align={align} sideOffset={8} className="w-72 space-y-3 p-3">
        <div>
          <p className="text-sm font-semibold leading-none">Change profile photo</p>
        </div>
        {hasPhoto && currentSrc && !file ? (
          <div className="flex items-center gap-4 rounded-lg border p-3">
            <img src={currentSrc} alt={name || "Profile photo"} className="size-16 rounded-full object-cover" />
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              {decodeURIComponent(currentSrc.split("?")[0].split("/").pop() || "photo")}
            </p>
            {onRemove && (
              <Button type="button" variant="ghost" size="icon" className="size-8" onClick={remove} disabled={busy} aria-label="Remove photo">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              </Button>
            )}
          </div>
        ) : (
          <FileDropzone value={file} onChange={setFile} disabled={busy} />
        )}
        {hasPhoto && currentSrc && !file && (
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Upload below to replace it</p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" className="h-8" onClick={submit} disabled={!file || busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? "Uploading…" : "Save"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
