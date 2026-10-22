import * as React from "react"
import { ImageIcon, UploadCloud, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileDropzoneProps {
  value: File | null
  onChange: (file: File | null) => void
  accept?: string
  /** max size in MB */
  maxSizeMB?: number
  disabled?: boolean
  className?: string
}

/** Single-file drag & drop / click-to-browse upload area with image preview. */
export function FileDropzone({
  value,
  onChange,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  maxSizeMB = 5,
  disabled,
  className,
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!value) return setPreview(null)
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const pick = (file?: File | null) => {
    if (!file) return
    if (accept && !accept.split(",").includes(file.type)) return setError("Unsupported file type")
    if (file.size > maxSizeMB * 1024 * 1024) return setError(`File must be under ${maxSizeMB} MB`)
    const probe = new Image()
    const url = URL.createObjectURL(file)
    probe.onload = () => {
      URL.revokeObjectURL(url)
      if (probe.naturalWidth < 64 || probe.naturalHeight < 64) return setError("Image must be at least 64×64 px")
      setError(null)
      onChange(file)
    }
    probe.onerror = () => {
      URL.revokeObjectURL(url)
      setError("This file isn't a readable image")
    }
    probe.src = url
  }

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ""
        }}
      />
      {preview ? (
        <div className="flex items-center gap-4 rounded-lg border p-3">
          <img src={preview} alt="Preview" className="size-16 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value?.name}</p>
            <p className="text-xs text-muted-foreground">{((value?.size ?? 0) / 1024).toFixed(0)} KB</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="size-8" disabled={disabled} onClick={() => onChange(null)} aria-label="Remove file">
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            pick(e.dataTransfer.files?.[0])
          }}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-6 text-center transition-colors hover:bg-accent/50",
            dragging && "border-primary bg-accent",
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-muted">
            {dragging ? <ImageIcon className="size-5" /> : <UploadCloud className="size-5" />}
          </span>
          <span className="text-sm font-medium">Drag & drop or click to upload</span>
          <span className="text-xs text-muted-foreground">PNG, JPG, WEBP or GIF, up to {maxSizeMB} MB</span>
        </button>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
