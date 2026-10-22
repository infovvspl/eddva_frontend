import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"

interface AvatarUploadPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Upload the file; reject/throw to show an error. */
  onUpload: (file: File) => Promise<unknown>
  /** The element the popover opens under (a button or the avatar). */
  children: React.ReactNode
  align?: "start" | "center" | "end"
}

/** "Change photo" popover that opens right under its anchor, shadcn dropdown style. */
export function AvatarUploadPopover({ open, onOpenChange, onUpload, children, align = "end" }: AvatarUploadPopoverProps) {
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

  return (
    <Popover open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <PopoverAnchor asChild>
        <span className="inline-flex">{children}</span>
      </PopoverAnchor>
      <PopoverContent align={align} sideOffset={8} className="w-72 space-y-3 p-3">
        <div>
          <p className="text-sm font-semibold leading-none">Change profile photo</p>
          <p className="mt-1 text-xs text-muted-foreground">Upload a square image for best results.</p>
        </div>
        <FileDropzone value={file} onChange={setFile} disabled={busy} />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
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
