/**
 * Reusable skeleton fragments for route-level loading.tsx files.
 *
 * Next.js renders the nearest `loading.tsx` while the page component
 * fetches its data - using a real skeleton (vs. a blank page or a
 * lone spinner) makes the wait feel instant because the layout is
 * already in place when the data lands.
 */

import { Skeleton } from '@/components/ui/skeleton';

/** Generic vertical-stack body with title + table-like rows. */
export function ListPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-20 rounded ml-auto" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 last:border-b-0">
            <Skeleton className="h-9 w-9 rounded-md shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 rounded" style={{ width: `${45 + Math.random() * 40}%` }} />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Grid skeleton (3-up cards) for dashboard-style pages. */
export function GridPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <Skeleton className="h-8 w-72 rounded-md" />
      <Skeleton className="h-4 w-1/2 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(cards)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
            <Skeleton className="h-32 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Document/space detail with sidebar + hero + content. */
export function SpaceDetailSkeleton() {
  return (
    <div className="flex h-full animate-pulse">
      {/* Sidebar */}
      <div className="w-60 shrink-0 border-r border-gray-200 p-4 space-y-3">
        <Skeleton className="h-4 w-32 rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 rounded" style={{ width: `${50 + Math.random() * 40}%` }} />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-end gap-4 px-6 h-16 border-b border-gray-200">
          <Skeleton className="h-9 w-64 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        {/* Cover banner */}
        <Skeleton className="h-64 w-full rounded-none" />
        {/* Body */}
        <div className="px-6 pt-6 space-y-5">
          <Skeleton className="h-10 w-72 rounded-md" />
          <Skeleton className="h-4 w-1/3 rounded" />
          <div className="border border-gray-200 rounded-lg p-4 mt-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-4 rounded flex-1" style={{ maxWidth: `${30 + Math.random() * 50}%` }} />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Public-facing share view (banner + folder list, no sidebar) */
export function PublicSpaceSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="h-16 border-b border-gray-200 bg-white flex items-center px-6">
        <Skeleton className="h-7 w-32 rounded" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-72 w-full rounded-none" />
      <div className="max-w-6xl mx-auto px-6 pb-12 -mt-12 relative">
        <div className="flex items-end gap-4 mb-6">
          <Skeleton className="h-24 w-24 rounded-lg" />
          <Skeleton className="h-8 w-64 rounded mb-2" />
        </div>
        <div className="space-y-3 mt-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
