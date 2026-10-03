export function SkeletonCard() {
  return (
    <div className="h-56 animate-pulse rounded-2xl border border-border bg-card p-5">
      <div className="h-10 w-2/3 rounded bg-secondary" />
      <div className="mt-5 h-3 rounded bg-secondary" />
      <div className="mt-3 h-3 w-4/5 rounded bg-secondary" />
      <div className="mt-8 h-8 rounded bg-secondary" />
    </div>
  );
}

export function SkeletonRows() {
  return (
    <div className="space-y-4 pt-6">
      <div className="h-24 animate-pulse rounded-xl bg-secondary" />
      <div className="h-10 animate-pulse rounded-xl bg-secondary" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
