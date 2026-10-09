import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-2 h-3 w-20" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="flex items-end gap-3 h-64 pt-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-lg"
            // Vary heights for natural skeleton look
            style={{ height: `${25 + (i * 12) % 65}%` }}
          />
        ))}
      </div>
    </div>
  );
}
