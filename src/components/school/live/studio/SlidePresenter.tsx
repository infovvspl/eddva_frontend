import { useCallback, useEffect, useRef, useState } from 'react';
import { pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, FileUp, Loader2, X, Presentation } from 'lucide-react';

// Reuse the same worker the rest of the app already configures.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * SlidePresenter — present a PDF (or a set of pre-generated slide images) inside
 * the Studio. Each slide is rendered to an offscreen canvas and handed to the
 * compositor via `onSlide`, so it's baked into the live stream and recording.
 * The whiteboard "Annotate" overlay works on top of whatever slide is showing.
 *
 * PPTX is intentionally not supported here — teachers export to PDF (decided).
 */

export interface SlidePresenterProps {
  /** Optional pre-generated slide image URLs (e.g. from the PPT generator). */
  imageUrls?: string[];
  /** Called with the current slide as a drawable source + its intrinsic size. */
  onSlide: (img: CanvasImageSource | null, w: number, h: number) => void;
  className?: string;
}

const RENDER_SCALE = 2; // render at 2× for crisp 720p compositing

export default function SlidePresenter({ imageUrls, onSlide, className }: SlidePresenterProps) {
  const [slides, setSlides] = useState<HTMLCanvasElement[] | HTMLImageElement[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const total = slides.length;

  // Push the active slide to the compositor whenever it changes.
  useEffect(() => {
    const slide = slides[index];
    if (slide) {
      const w = (slide as HTMLCanvasElement).width || (slide as HTMLImageElement).naturalWidth;
      const h = (slide as HTMLCanvasElement).height || (slide as HTMLImageElement).naturalHeight;
      onSlide(slide, w, h);
    } else {
      onSlide(null, 0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides, index]);

  // Load pre-generated slide images if provided.
  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all(
      imageUrls.map(
        (url) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('image load failed'));
            img.src = url;
          }),
      ),
    )
      .then((imgs) => {
        if (cancelled) return;
        setSlides(imgs);
        setIndex(0);
        setFileName(`${imgs.length} slides`);
      })
      .catch(() => !cancelled && setError('Could not load slide images'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [imageUrls]);

  const loadPdf = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf }).promise;
      const canvases: HTMLCanvasElement[] = [];
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        // Flatten onto white so transparent PDFs don't composite as black.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        canvases.push(canvas);
      }
      setSlides(canvases);
      setIndex(0);
      setFileName(file.name);
    } catch (e: any) {
      setError(e?.message || 'Failed to open PDF');
    } finally {
      setLoading(false);
    }
  }, []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void loadPdf(file);
    e.target.value = '';
  };

  const clear = () => {
    setSlides([]);
    setIndex(0);
    setFileName(null);
    onSlide(null, 0, 0);
  };

  const go = (delta: number) => setIndex((i) => Math.min(Math.max(i + delta, 0), total - 1));

  // Empty state — prompt to load a PDF.
  if (total === 0) {
    return (
      <div className={className}>
        <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
          <Presentation className="mb-3 h-10 w-10 text-slate-400" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Present slides in your class</p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">Upload a PDF — export your PowerPoint to PDF first. Students see each slide live.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            {loading ? 'Loading…' : 'Upload PDF'}
          </button>
          {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
        </div>
        <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onPick} />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex min-w-0 items-center gap-2">
          <Presentation className="h-4 w-4 shrink-0 text-blue-500" />
          <span className="truncate text-xs font-bold text-slate-600 dark:text-slate-300">{fileName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => go(-1)} disabled={index === 0} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[3.5rem] text-center text-xs font-black text-slate-700 dark:text-slate-200">{index + 1} / {total}</span>
          <button onClick={() => go(1)} disabled={index === total - 1} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={clear} title="Close slides" className="ml-1 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${i === index ? 'border-blue-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
            title={`Slide ${i + 1}`}
          >
            <SlideThumb slide={s} />
            <span className="absolute bottom-0 right-0 rounded-tl bg-black/60 px-1 text-[9px] font-bold text-white">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Renders a slide canvas/image into a small preview img via toDataURL/src. */
function SlideThumb({ slide }: { slide: HTMLCanvasElement | HTMLImageElement }) {
  const [src, setSrc] = useState<string>('');
  useEffect(() => {
    if (slide instanceof HTMLCanvasElement) {
      try { setSrc(slide.toDataURL('image/jpeg', 0.5)); } catch { setSrc(''); }
    } else {
      setSrc(slide.src);
    }
  }, [slide]);
  return src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-slate-200 dark:bg-slate-700" />;
}
