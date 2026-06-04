import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadDoubtImage } from '@/lib/school/doubt-upload';

export function DoubtImagePreview({ url, alt = 'Attached image', className = '' }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={`block ${className}`}>
      <img
        src={url}
        alt={alt}
        className="max-h-64 w-full rounded-xl border border-slate-200 object-contain dark:border-slate-700"
      />
    </a>
  );
}

export default function DoubtImageAttach({ imageUrl, previewUrl, onChange, label = 'Attach image (optional)' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setErr('');
    setUploading(true);
    try {
      const url = await uploadDoubtImage(file);
      onChange(url, URL.createObjectURL(file));
    } catch (e) {
      setErr(e?.message || 'Upload failed');
      onChange(null, null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clear = () => {
    onChange(null, null);
    setErr('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? 'Uploading…' : label}
        </button>
        {imageUrl && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <X className="h-4 w-4" /> Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {(previewUrl || imageUrl) && (
        <DoubtImagePreview url={previewUrl || imageUrl} alt="Preview" />
      )}
      {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
    </div>
  );
}
