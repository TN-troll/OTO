/**
 * Premium skeleton card with shimmer effect for loading states.
 * Uses the glassmorphism design system.
 */
export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[20px] bg-white/60 backdrop-blur-xl border border-white/20 dark:bg-white/[0.04] dark:border-white/[0.08] shadow-glass">
      {/* Image skeleton with shimmer */}
      <div className="relative aspect-[3/2] overflow-hidden bg-surface-100 dark:bg-surface-800">
        <div className="absolute inset-0 animate-shimmer motion-reduce:animate-none bg-gradient-to-r from-transparent via-white/40 to-transparent bg-[length:200%_100%] dark:via-white/[0.06]" />
      </div>
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded-lg bg-surface-100 dark:bg-surface-800 overflow-hidden relative">
          <div className="absolute inset-0 animate-shimmer motion-reduce:animate-none bg-gradient-to-r from-transparent via-white/60 to-transparent bg-[length:200%_100%] dark:via-white/[0.08]" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden relative">
            <div className="absolute inset-0 animate-shimmer motion-reduce:animate-none bg-gradient-to-r from-transparent via-white/60 to-transparent bg-[length:200%_100%] dark:via-white/[0.08]" />
          </div>
          <div className="h-6 w-14 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden relative">
            <div className="absolute inset-0 animate-shimmer motion-reduce:animate-none bg-gradient-to-r from-transparent via-white/60 to-transparent bg-[length:200%_100%] dark:via-white/[0.08]" />
          </div>
          <div className="h-6 w-16 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden relative">
            <div className="absolute inset-0 animate-shimmer motion-reduce:animate-none bg-gradient-to-r from-transparent via-white/60 to-transparent bg-[length:200%_100%] dark:via-white/[0.08]" />
          </div>
        </div>
        <div className="flex justify-between items-center pt-1">
          <div className="h-6 w-24 rounded-lg bg-surface-100 dark:bg-surface-800" />
          <div className="h-8 w-8 rounded-full bg-surface-100 dark:bg-surface-800" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid w-full max-w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-in motion-reduce:animate-none">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}
