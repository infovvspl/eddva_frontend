// ImageCropModal.tsx — drag-to-reposition + zoom cover-image cropper.
//
// No crop library — the interaction is small enough to do by hand: the image
// always covers a fixed-aspect viewport (like CSS object-fit: cover), you pan
// it by dragging and zoom with a slider, and "Use this crop" renders exactly
// what's visible in the viewport onto an output-sized canvas.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface Props {
  file: File;
  aspect?: number; // width / height
  outputWidth?: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

const VIEWPORT_WIDTH = 440;

export default function ImageCropModal({ file, aspect = 16 / 9, outputWidth = 1200, onCancel, onConfirm }: Props) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const viewportHeight = VIEWPORT_WIDTH / aspect;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = natural.w && natural.h
    ? Math.max(VIEWPORT_WIDTH / natural.w, viewportHeight / natural.h)
    : 1;
  const scale = baseScale * zoom;
  const displayW = natural.w * scale;
  const displayH = natural.h * scale;

  const clamp = (x: number, y: number) => {
    const maxX = Math.max(0, (displayW - VIEWPORT_WIDTH) / 2);
    const maxY = Math.max(0, (displayH - viewportHeight) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  };

  useEffect(() => {
    setOffset((o) => clamp(o.x, o.y));
    // Re-clamp whenever zoom or the image's natural size changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, natural.w, natural.h]);

  const handleImgLoad = () => {
    if (imgRef.current) {
      setNatural({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(clamp(dragRef.current.origX + dx, dragRef.current.origY + dy));
  };
  const onPointerUp = () => { dragRef.current = null; };

  const handleConfirm = () => {
    if (!imgRef.current || !natural.w) return;
    const outputHeight = Math.round(outputWidth / aspect);
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropX = (displayW / 2 - VIEWPORT_WIDTH / 2 - offset.x) / scale;
    const cropY = (displayH / 2 - viewportHeight / 2 - offset.y) / scale;
    const cropW = VIEWPORT_WIDTH / scale;
    const cropH = viewportHeight / scale;

    ctx.drawImage(imgRef.current, cropX, cropY, cropW, cropH, 0, 0, outputWidth, outputHeight);
    canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-black text-slate-900 dark:text-white">Adjust cover image</h3>

        <div
          className="relative mx-auto touch-none select-none overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800"
          style={{ width: VIEWPORT_WIDTH, height: viewportHeight }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {imgUrl && (
            <img
              ref={imgRef}
              src={imgUrl}
              onLoad={handleImgLoad}
              alt=""
              draggable={false}
              className="absolute left-1/2 top-1/2 max-w-none cursor-grab active:cursor-grabbing"
              style={{
                width: displayW || undefined,
                height: displayH || undefined,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Drag the image to reposition. It's cropped to the same 16:9 shape shown on the site.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            Use this crop
          </button>
        </div>
      </div>
    </div>
  );
}
