import { cn } from "@/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded bg-muted shimmer", className)}
      {...props}
    />
  );
}

/** A full page/card skeleton for loading states */
function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-3 w-3/5" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", count >= 4 ? "lg:grid-cols-4" : `lg:grid-cols-${count}`)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <Skeleton className="h-9 w-9 rounded-lg mb-3" />
          <Skeleton className="h-6 w-16 mb-1.5" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      <div className="bg-surface px-4 py-2.5 border-b border-border">
        <Skeleton className="h-3 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3.5 border-b border-border last:border-0 flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-7 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for chapter list on course detail page */
function ChapterSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-xs flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for chat/AI study interface */
function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* AI message skeleton */}
      <div className="flex items-start gap-3 max-w-[85%]">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
      {/* User message skeleton */}
      <div className="flex items-start gap-3 max-w-[70%] ml-auto">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      {/* AI message skeleton */}
      <div className="flex items-start gap-3 max-w-[85%]">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for exam cards */
function ExamCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { Skeleton, CardSkeleton, StatsSkeleton, TableSkeleton, ChapterSkeleton, ChatSkeleton, ExamCardSkeleton };
