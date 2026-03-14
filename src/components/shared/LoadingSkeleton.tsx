import { cn } from "@/lib/utils";

export const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-lg bg-muted", className)} />
);

export const CardSkeleton = () => (
  <div className="card-surface p-5 space-y-3">
    <LoadingSkeleton className="w-9 h-9 rounded-lg" />
    <LoadingSkeleton className="w-20 h-7" />
    <LoadingSkeleton className="w-28 h-4" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="card-surface p-1 space-y-1">
    <LoadingSkeleton className="w-full h-10 rounded-lg" />
    {Array.from({ length: rows }).map((_, i) => (
      <LoadingSkeleton key={i} className="w-full h-12 rounded-lg" />
    ))}
  </div>
);
