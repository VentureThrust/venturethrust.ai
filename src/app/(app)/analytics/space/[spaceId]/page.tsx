
'use client';

import { useParams, notFound } from 'next/navigation';
import { useSpaces } from '@/lib/spaces-provider';
import { AnalyticsView } from '../../[documentId]/_components/analytics-view';
import { type Viewer } from '@/lib/data';
import { useMemo } from 'react';

export default function SpaceAnalyticsPage() {
  const params = useParams();
  const spaceId = params.spaceId as string;

  const { findSpace } = useSpaces();
  const space = findSpace(spaceId);

  if (!space) {
    notFound();
  }

  const viewers: Viewer[] = useMemo(() => {
    if (!space?.visits) return [];
    
    // Convert space visits to the Viewer format expected by AnalyticsView
    return space.visits.map(visit => ({
      email: visit.email,
      ipAddress: '127.0.0.1', // Placeholder
      device: visit.device,
      timeSpent: visit.durationSeconds,
      pageViews: visit.pageViews,
      repeatVisits: 1, // This would need more complex logic to track properly
      forwardTracking: false, // Placeholder
      lastViewed: visit.time,
    }));
  }, [space?.visits]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Space Analytics: {space.title}
        </h1>
        <p className="text-muted-foreground">
          Engagement insights for your Space.
        </p>
      </div>

      <AnalyticsView documentName={space.title} viewers={viewers} />
    </div>
  );
}
