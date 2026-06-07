
'use client';

import { useMemo } from 'react';
import type { File, Visit } from '@/lib/folder-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { File as FileIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface PerformanceViewProps {
  file: File;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md p-2 shadow-lg">
        <p className="label font-semibold">{`Page ${label}`}</p>
        <p className="intro text-sm text-muted-foreground">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};


export function PerformanceView({ file }: PerformanceViewProps) {
  const { visits = [] } = file;

  const coreMetrics = useMemo(() => {
    if (visits.length === 0) {
      return { avgViewed: 0, totalVisits: 0 };
    }
    const totalVisits = visits.length;
    const avgViewed = visits.reduce((acc, v) => acc + v.viewPercentage, 0) / totalVisits;
    return { avgViewed: Math.round(avgViewed), totalVisits };
  }, [visits]);

  const topPages = useMemo(() => {
    const pageTimes: Record<string, { totalTime: number; visitCount: number }> = {};
    visits.forEach(visit => {
      Object.entries(visit.pageViews || {}).forEach(([page, time]) => {
        if (!pageTimes[page]) {
          pageTimes[page] = { totalTime: 0, visitCount: 0 };
        }
        pageTimes[page].totalTime += time;
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
      .slice(0, 1); // Get top page
  }, [visits]);

  const comparativeStats = useMemo(() => {
      const pageData: Record<string, { time: number[], visitors: Set<string> }> = {};
      
      visits.forEach(visit => {
          Object.entries(visit.pageViews || {}).forEach(([page, time]) => {
              if(!pageData[page]) {
                  pageData[page] = { time: [], visitors: new Set() };
              }
              pageData[page].time.push(time);
              pageData[page].visitors.add(visit.id);
          });
      });
      
      const pageNumbers = Object.keys(pageData).map(Number).sort((a, b) => a - b);
      
      const timePerPage = pageNumbers.map(page => {
          const times = pageData[String(page)].time;
          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
          return { page, avgTime: Math.round(avgTime) };
      });
      
      let cumulativeVisitors = new Set<string>();
      const dropoffReport = pageNumbers.map(page => {
          const visitorsForPage = pageData[String(page)].visitors;
          cumulativeVisitors = new Set([...cumulativeVisitors, ...visitorsForPage]);
          const percentage = (visitorsForPage.size / visits.length) * 100;
          return { page, percentage: Math.round(percentage) };
      });

      return { timePerPage, dropoffReport };

  }, [visits]);

  return (
    <div className="space-y-6 mt-4">
        <Card>
            <CardHeader>
                <CardTitle>Latest Version Highlights</CardTitle>
                <CardDescription>(version 1)</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Avg. Viewed</p>
                        <p className="text-4xl font-bold">{coreMetrics.avgViewed}%</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Visit</p>
                        <p className="text-4xl font-bold">{coreMetrics.totalVisits}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Top Pages (by average time per page)</h4>
                    {topPages.length > 0 ? (
                        topPages.map(page => (
                            <div key={page.page} className="flex items-center gap-4">
                                <FileIcon className="h-10 w-10 text-muted-foreground"/>
                                <div>
                                    <p className="font-bold">{new Date(page.avgTime * 1000).toISOString().substr(14, 5)}</p>
                                    <p className="text-sm text-muted-foreground">Page: {page.page}</p>
                                    <p className="text-sm text-muted-foreground">Visits: {page.visits}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">No page view data available.</p>
                    )}
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Comparative Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <h4 className="font-semibold mb-4">Time Per Page <span className="text-sm text-muted-foreground">(average seconds per visit)</span></h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={comparativeStats.timePerPage} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="page" tickFormatter={(value) => `Page ${value}`} />
                            <YAxis domain={[0, 'dataMax + 10']}/>
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="avgTime" name="Avg. Time" stroke="#3b82f6" strokeWidth={2} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div>
                     <h4 className="font-semibold mb-4">Dropoff Report <span className="text-sm text-muted-foreground">(percent of visits reaching page)</span></h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={comparativeStats.dropoffReport} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="page" tickFormatter={(value) => `Page ${value}`} />
                            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`}/>
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="percentage" name="Reach" stroke="#3b82f6" strokeWidth={2} dot={{ r: 5 }} activeDot={{ r: 8 }}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
