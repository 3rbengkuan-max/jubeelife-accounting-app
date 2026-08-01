import { Card } from "@/components/ui";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-6 w-28 animate-pulse rounded bg-slate-200" />
        </Card>
      ))}
    </div>
  );
}

export function PageSkeleton({ title }: { title: string }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        <div className="mt-2 h-3 w-64 animate-pulse rounded bg-slate-200" />
      </div>
      <TableSkeleton />
    </div>
  );
}
