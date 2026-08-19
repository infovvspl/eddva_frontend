import { useCallback, useEffect, useRef, useState } from 'react';
import { Pen, Highlighter, Eraser, Undo2, Trash2 } from 'lucide-react';

/**
 * Whiteboard — a lightweight, dependency-free drawing layer for the Studio.
 *
 * Draws onto a TRANSPARENT canvas at the output resolution (default 1280×720) so
 * the Studio compositor can either (a) fill white behind it for a blank board, or
 * (b) draw it on top of a screen share / slide as an annotation overlay. The same
 * canvas element is handed to the compositor via `onReady`, so whatever the teacher
 * draws is baked into the live stream and the recording 1:1.
 */

type Tool = 'pen' | 'highlighter' | 'eraser';
interface Point { x: number; y: number }
interface Stroke { tool: Tool; color: string; width: number; points: Point[] }

const COLORS = ['#0f172a', '#ef4444', '#2563eb', '#16a34a', '#f59e0b', '#ffffff'];
const WIDTHS = [3, 6, 12];

export interface WhiteboardProps {
  width?: number;
  height?: number;
  /** When false, pointer events pass through (drawing disabled). */
  active: boolean;
  /** Called once the backing canvas exists — pass it to the Studio compositor. */
  onReady?: (canvas: HTMLCanvasElement) => void;
  className?: string;
}

export default function Whiteboard({ width = 1280, height = 720, active, onReady, className }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef<Stroke | null>(null);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [width_, setWidth] = useState<number>(WIDTHS[1]);
  const [, force] = useState(0); // re-render toolbar state

  useEffect(() => {
    const c = canvasRef.current;
    if (c) {
      c.width = width;
      c.height = height;
      onReady?.(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyStyle = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (s.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = s.width * 4;
    } else if (s.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = hexToRgba(s.color, 0.35);
      ctx.lineWidth = s.width * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
    }
  };

  const strokePath = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    if (s.points.length < 1) return;
    applyStyle(ctx, s);
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
    // A single tap should still leave a dot.
    if (s.points.length === 1) ctx.lineTo(s.points[0].x + 0.1, s.points[0].y + 0.1);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };

  const redraw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    for (const s of strokesRef.current) strokePath(ctx, s);
    if (drawingRef.current) strokePath(ctx, drawingRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  const toInternal = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * width,
      y: ((e.clientY - rect.top) / rect.height) * height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!active) return;
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drawingRef.current = { tool, color, width: width_, points: [toInternal(e)] };
    redraw();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!active || !drawingRef.current) return;
    drawingRef.current.points.push(toInternal(e));
    redraw();
  };
  const onPointerUp = () => {
    if (!drawingRef.current) return;
    strokesRef.current.push(drawingRef.current);
    drawingRef.current = null;
    redraw();
  };

  const undo = () => { strokesRef.current.pop(); redraw(); };
  const clear = () => { strokesRef.current = []; drawingRef.current = null; redraw(); };

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="absolute inset-0 h-full w-full"
        style={{ touchAction: 'none', cursor: active ? 'crosshair' : 'default', pointerEvents: active ? 'auto' : 'none' }}
      />

      {active && (
        <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-200/70 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <TbButton active={tool === 'pen'} onClick={() => { setTool('pen'); force((n) => n + 1); }} title="Pen"><Pen className="h-4 w-4" /></TbButton>
          <TbButton active={tool === 'highlighter'} onClick={() => { setTool('highlighter'); force((n) => n + 1); }} title="Highlighter"><Highlighter className="h-4 w-4" /></TbButton>
          <TbButton active={tool === 'eraser'} onClick={() => { setTool('eraser'); force((n) => n + 1); }} title="Eraser"><Eraser className="h-4 w-4" /></TbButton>

          <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool((t) => (t === 'eraser' ? 'pen' : t)); force((n) => n + 1); }}
              className={`h-5 w-5 rounded-full border transition ${color === c ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900' : 'border-slate-300 dark:border-slate-600'}`}
              style={{ background: c }}
              title="Color"
            />
          ))}

          <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

          {WIDTHS.map((w) => (
            <button
              key={w}
              onClick={() => { setWidth(w); force((n) => n + 1); }}
              className={`grid h-7 w-7 place-items-center rounded-lg transition ${width_ === w ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title={`${w}px`}
            >
              <span className="rounded-full bg-slate-700 dark:bg-slate-200" style={{ width: w, height: w }} />
            </button>
          ))}

          <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

          <TbButton onClick={undo} title="Undo"><Undo2 className="h-4 w-4" /></TbButton>
          <TbButton onClick={clear} title="Clear all"><Trash2 className="h-4 w-4" /></TbButton>
        </div>
      )}
    </div>
  );
}

function TbButton({ children, active, onClick, title }: { children: React.ReactNode; active?: boolean; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`grid h-7 w-7 place-items-center rounded-lg transition ${active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
    >
      {children}
    </button>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
