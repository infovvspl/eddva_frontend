import React, { useEffect, useImperativeHandle, useRef } from "react";

export type CelebrationShape = "rect" | "square" | "strip" | "circle" | "triangle";

export interface CelebrationCursorProps {
  colors?: string[];
  shapes?: CelebrationShape[];
  size?: number;
  sizeVariance?: number;
  gravity?: number;
  drag?: number;
  flutter?: number;
  spin?: number;
  life?: number;
  fade?: number;
  maxPieces?: number;
  burstCount?: number;
  burstPower?: number;
  burstSpread?: number;
  /** Fires a two-corner confetti cannon once, shortly after mount. */
  autoplay?: boolean;
  autoplayDelay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export interface CelebrationCursorHandle {
  burst: (x?: number, y?: number, angle?: number) => void;
  cannons: () => void;
  clear: () => void;
}

type Piece = {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; shape: CelebrationShape;
  rotation: number; spin: number; age: number; life: number;
};

const DEFAULT_COLORS = ["#4F46E5", "#2563EB", "#10B981", "#F59E0B", "#EC4899", "#06B6D4"];
const DEFAULT_SHAPES: CelebrationShape[] = ["rect", "square", "circle", "strip"];

function drawPiece(ctx: CanvasRenderingContext2D, p: Piece, opacity: number) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = opacity;
  ctx.fillStyle = p.color;
  const s = p.size;
  switch (p.shape) {
    case "circle":
      ctx.beginPath();
      ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(0, -s / 2);
      ctx.lineTo(s / 2, s / 2);
      ctx.lineTo(-s / 2, s / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case "strip":
      ctx.fillRect(-s / 4, -s, s / 2, s * 2);
      break;
    case "square":
      ctx.fillRect(-s / 2, -s / 2, s, s);
      break;
    default:
      ctx.fillRect(-s / 2, -s / 3, s, (s * 2) / 3);
  }
  ctx.restore();
}

/**
 * Lightweight, dependency-free confetti burst — a stand-in for ReactBits Pro's
 * licensed CelebrationCursor (that registry needs a paid account key we don't have).
 * Mirrors its core API: autoplay cannons on mount, plus a `burst()` ref method.
 */
export const CelebrationCursor = React.forwardRef<CelebrationCursorHandle, CelebrationCursorProps>(
  (
    {
      colors = DEFAULT_COLORS,
      shapes = DEFAULT_SHAPES,
      size = 8,
      sizeVariance = 4,
      gravity = 420,
      drag = 0.015,
      flutter = 1.4,
      spin = 6,
      life = 2.2,
      fade = 0.35,
      maxPieces = 220,
      burstCount = 60,
      burstPower = 620,
      burstSpread = 70,
      autoplay = true,
      autoplayDelay = 150,
      className,
      style,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const piecesRef = useRef<Piece[]>([]);
    const rafRef = useRef(0);
    const lastRef = useRef(0);

    const spawnBurst = (x: number, y: number, angleDeg: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const angle = (angleDeg * Math.PI) / 180;
      const spreadRad = (burstSpread * Math.PI) / 180;
      for (let i = 0; i < burstCount; i++) {
        if (piecesRef.current.length >= maxPieces) piecesRef.current.shift();
        const a = angle + (Math.random() - 0.5) * spreadRad;
        const speed = burstPower * (0.5 + Math.random() * 0.5);
        piecesRef.current.push({
          x, y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          size: size + Math.random() * sizeVariance,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * spin,
          age: 0,
          life: life * (0.7 + Math.random() * 0.6),
        });
      }
      wake();
    };

    const burst = (x?: number, y?: number, angleDeg = -90) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      spawnBurst(x ?? canvas.width / 2, y ?? canvas.height / 2, angleDeg);
    };

    const cannons = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      spawnBurst(canvas.width * 0.06, canvas.height, -70);
      spawnBurst(canvas.width * 0.94, canvas.height, -110);
    };

    const clear = () => {
      piecesRef.current = [];
    };

    useImperativeHandle(ref, () => ({ burst, cannons, clear }), []);

    const wake = () => {
      if (rafRef.current) return;
      lastRef.current = performance.now();
      rafRef.current = requestAnimationFrame(frame);
    };

    const frame = (now: number) => {
      rafRef.current = 0;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastRef.current) / 1000));
      lastRef.current = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const next: Piece[] = [];
      for (const p of piecesRef.current) {
        p.age += dt;
        if (p.age >= p.life) continue;
        p.vx *= 1 - drag;
        p.vy = p.vy * (1 - drag) + gravity * dt;
        p.x += p.vx * dt + Math.sin((p.age + p.x) * flutter) * 6 * dt;
        p.y += p.vy * dt;
        p.rotation += p.spin * dt;
        if (p.y > canvas.height + 40) continue;
        const lifeLeft = 1 - p.age / p.life;
        const opacity = lifeLeft < fade ? Math.max(0, lifeLeft / fade) : 1;
        drawPiece(ctx, p, opacity);
        next.push(p);
      }
      piecesRef.current = next;
      if (next.length > 0) rafRef.current = requestAnimationFrame(frame);
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return undefined;
      const parent = canvas.parentElement;

      const resize = () => {
        const rect = (parent ?? canvas).getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        const ctx = canvas.getContext("2d");
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      const ro = new ResizeObserver(resize);
      if (parent) ro.observe(parent);

      let timer: ReturnType<typeof setTimeout> | undefined;
      if (autoplay) {
        timer = setTimeout(() => cannons(), autoplayDelay);
      }

      return () => {
        ro.disconnect();
        if (timer) clearTimeout(timer);
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoplay, autoplayDelay]);

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={className}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", minHeight: 240, ...style }}
      />
    );
  },
);
CelebrationCursor.displayName = "CelebrationCursor";

export default CelebrationCursor;
