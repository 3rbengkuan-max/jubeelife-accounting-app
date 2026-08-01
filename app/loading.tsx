import { CardsSkeleton, TableSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-7 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-3 w-56 animate-pulse rounded bg-slate-100" />
      </div>
      <CardsSkeleton />
      <div className="mt-6">
        <TableSkeleton />
      </div>
    </div>
  );
}
