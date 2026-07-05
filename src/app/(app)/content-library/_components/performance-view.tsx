'use client';

/**
 * PerformanceView - DocSend-style per-document performance:
 *   • Core Metrics: Avg Viewed %, Visits
 *   • Top Pages by average time per page (top 3, page-card style)
 *   • Time Per Page line chart (average seconds per visit)
 *   • Dropoff Report (percent of visits reaching each page)
 *
 * Data source: file.visits - each visit carries its own per-page dwell in
 * `pageViews` (recorded by the space viewer, the emailed-file viewer, and
 * the agreement signing page alike, so agreements get the same insight).
 */

import { useMemo } from 'react';
import type { File } from '@/lib/folder-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, TooltipProps,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface PerformanceViewProps {
  file: File;
}

const fmtTime = (secs: number) => {
  const s = Math.round(secs);
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md p-2 shadow-lg">
        <p className="label font-semibold">{`Page ${label}`}</p>
        <p className="intro text-sm text-muted-foreground">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

/** DocSend-style miniature page card. */
function PageThumb() {
  return (
    <div className="grid h-16 w-12 shrink-0 place-items-center rounded-sm border border-gray-200 bg-white shadow-sm">
      <div className="flex w-8 flex-col gap-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-0.5 rounded bg-gray-200" style={{ width: `${100 - i * 12}%` }} />
        ))}
      </div>
    </div>
  );
}

export function PerformanceView({ file }: PerformanceViewProps) {
  const { visits = [] } = file;

  const coreMetrics = useMemo(() => {
    if (visits.length === 0) return { avgViewed: 0, totalVisits: 0 };
    const totalVisits = visits.length;
    const avgViewed = visits.reduce((acc, v) => acc + (Number(v.viewPercentage) || 0), 0) / totalVisits;
    return { avgViewed: Math.round(avgViewed), totalVisits };
  }, [visits]);

  const topPages = useMemo(() => {
    const pageTimes: Record<string, { totalTime: number; visitCount: number }> = {};
    visits.forEach((visit) => {
      Object.entries(visit.pageViews || {}).forEach(([page, time]) => {
        if (!/^\d+$/.test(page)) return;
        if (!pageTimes[page]) pageTimes[page] = { totalTime: 0, visitCount: 0 };
        pageTimes[page].totalTime += Number(time) || 0;
        pageTimes[page].visitCount += 1;
      });
    });
    return Object.entries(pageTimes)
      .map(([page, data]) => ({
        page: parseInt(page, 10),
        avgTime: data.totalTime / data.visitCount,
        visits: data.visitCount,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 3);
  }, [visits]);

  const comparativeStats = useMemo(() => {
    // Per-page dwell across visits + each visit's farthest page.
    const pageTime: Record<number, number[]> = {};
    const maxPages: number[] = [];
    visits.forEach((visit) => {
      let maxPage = 0;
      Object.entries(visit.pageViews || {}).forEach(([page, time]) => {
        if (!/^\d+$/.test(page)) return;
        const p = parseInt(page, 10);
        if (!pageTime[p]) pageTime[p] = [];
        pageTime[p].push(Number(time) || 0);
        if (p > maxPage) maxPage = p;
      });
      if (maxPage > 0) maxPages.push(maxPage);
    });

    const lastPage = Math.max(0, ...Object.keys(pageTime).map(Number));
    if (lastPage === 0) return { timePerPage: [], dropoffReport: [] };

    // Every page from 1..last on the axis - a skipped page is real signal.
    const pages = Array.from({ length: lastPage }, (_, i) => i + 1);

    const timePerPage = pages.map((page) => {
      const times = pageTime[page] ?? [];
      const avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      return { page, avgTime: Math.round(avgTime * 10) / 10 };
    });

    // DocSend semantics: % of visits that REACHED the page (their farthest
    // page is >= it), so the line only ever goes down.
    const counted = maxPages.length || 1;
    const dropoffReport = pages.map((page) => ({
      page,
      percentage: Math.round((maxPages.filter((m) => m >= page).length / counted) * 100),
    }));

    return { timePerPage, dropoffReport };
  }, [visits]);

  const hasPageData = comparativeStats.timePerPage.length > 0;

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Latest Version Highlights</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Core metrics */}
          <div className="lg:col-span-2">
            <h4 className="mb-4 text-sm font-semibold text-muted-foreground">Core Metrics</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-4xl font-bold">{coreMetrics.avgViewed}<span className="text-xl align-top">%</span></p>
                <p className="mt-1 text-sm text-muted-foreground">Avg Viewed</p>
              </div>
              <div>
                <p className="text-4xl font-bold">{coreMetrics.totalVisits}</p>
                <p className="mt-1 text-sm text-muted-foreground">{coreMetrics.totalVisits === 1 ? 'Visit' : 'Visits'}</p>
              </div>
            </div>
          </div>

          {/* Top pages */}
          <div className="lg:col-span-3">
            <h4 className="mb-4 text-sm font-semibold text-muted-foreground">
              Top Pages <span className="font-normal">(by average time per page)</span>
            </h4>
            {topPages.length > 0 ? (
              <div className="flex flex-wrap gap-8">
                {topPages.map((page) => (
                  <div key={page.page} className="flex items-center gap-3">
                    <PageThumb />
                    <div>
                      <p className="text-lg font-bold">{fmtTime(page.avgTime)}</p>
                      <p className="text-sm text-muted-foreground">Page: {page.page}</p>
                      <p className="text-sm text-muted-foreground">Visits: {page.visits}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <FileText className="h-5 w-5" />
                Page data appears after the first visit with page activity.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Comparative Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h4 className="mb-4 font-semibold">
              Time Per Page <span className="text-sm font-normal text-muted-foreground">(average seconds per visit)</span>
            </h4>
            {hasPageData ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={comparativeStats.timePerPage} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="page" />
                  <YAxis domain={[0, 'dataMax + 2']} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="avgTime" name="Avg seconds" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">No page activity yet.</p>
            )}
          </div>
          <div>
            <h4 className="mb-4 font-semibold">
              Dropoff Report <span className="text-sm font-normal text-muted-foreground">(percent of visits reaching page)</span>
            </h4>
            {hasPageData ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={comparativeStats.dropoffReport} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="page" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="percentage" name="Reached" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">No page activity yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
