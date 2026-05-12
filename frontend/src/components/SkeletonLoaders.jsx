const Skeleton = ({ className }) => (
  <div className={`bg-white/[0.04] overflow-hidden relative rounded-xl ${className}`}>
    <div className="animate-shimmer h-full w-full" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex justify-between items-start gap-8">
      <div className="space-y-4 flex-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-14 w-3/4" />
        <Skeleton className="h-8 w-full max-w-lg" />
      </div>
      <Skeleton className="h-12 w-36 hidden lg:block" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <Skeleton className="lg:col-span-3 h-[400px]" />
      <Skeleton className="lg:col-span-2 h-[400px]" />
    </div>
  </div>
);

export const MessageSkeleton = () => (
  <div className="flex justify-start gap-3 mb-6">
    <Skeleton className="w-8 h-8 rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-3 w-[160px]" />
      <Skeleton className="h-12 w-[320px] rounded-2xl" />
    </div>
  </div>
);

export const SummarySkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <Skeleton key={i} className="h-48" />
    ))}
  </div>
);

export default Skeleton;
