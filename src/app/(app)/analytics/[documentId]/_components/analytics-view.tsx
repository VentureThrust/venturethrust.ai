'use client';

/**
 * AnalyticsView - per-document analytics body.
 *
 * Editorial layout (no card wrappers): a stats strip on top, then the
 * File Views chart, then the Viewer Details table - each separated by
 * a full-bleed horizontal line. The "AI-Powered Engagement Insights"
 * card was removed per user feedback ("remove that AI insight card").
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Users, Clock, Eye, BarChart,
  PieChart as PieChartIcon, ChevronDown, ChevronRight, FileText,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { type Viewer } from '@/lib/data';
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartContainer,
} from '@/components/ui/chart';
import {
  Bar, Pie, Cell,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  XAxis, YAxis,
} from 'recharts';

type AnalyticsViewProps = {
  documentName: string;
  viewers: Viewer[];
};

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// ─── Per-viewer expandable file breakdown ─────────────────────────────────────

function ViewerRow({ viewer }: { viewer: Viewer }) {
  const [expanded, setExpanded] = useState(false);

  const fileRows = Object.entries(viewer.pageViews).map(([fileName, opens]) => ({
    fileName,
    opens,
    timeSpent: viewer.fileTimeSpent?.[fileName] ?? 0,
  }));
  fileRows.sort((a, b) => b.timeSpent - a.timeSpent);

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(prev => !prev)}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {expanded
              ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            }
            <span className="truncate">{viewer.email}</span>
          </div>
        </TableCell>
        <TableCell>{fmtTime(viewer.timeSpent)}</TableCell>
        <TableCell>{viewer.repeatVisits}</TableCell>
        <TableCell>{viewer.device}</TableCell>
        <TableCell className="text-xs text-muted-foreground">{fmtDate(viewer.lastViewed)}</TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={5} className="py-0">
            <div className="px-8 py-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                File Breakdown
              </p>
              {fileRows.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No file data recorded.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b">
                      <th className="text-left font-medium pb-1.5 pr-4">File</th>
                      <th className="text-left font-medium pb-1.5 pr-4">Times Opened</th>
                      <th className="text-left font-medium pb-1.5 pr-4">Time Spent</th>
                      <th className="text-left font-medium pb-1.5">Avg. per Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fileRows.map((row, i) => {
                      const avgPerOpen = row.opens > 0 ? row.timeSpent / row.opens : 0;
                      const maxTime = fileRows[0]?.timeSpent || 1;
                      const barPct = Math.round((row.timeSpent / maxTime) * 100);

                      return (
                        <tr
                          key={row.fileName}
                          className={i < fileRows.length - 1 ? 'border-b border-border/50' : ''}
                        >
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span
                                className="truncate max-w-[260px] font-medium"
                                title={row.fileName}
                              >
                                {row.fileName}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 pr-4">
                            <Badge variant="secondary" className="text-xs font-normal">
                              {row.opens}×
                            </Badge>
                          </td>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                              <span className="tabular-nums">{fmtTime(row.timeSpent)}</span>
                            </div>
                          </td>
                          <td className="py-2 text-muted-foreground tabular-nums">
                            {fmtTime(avgPerOpen)} / open
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t text-xs font-semibold">
                      <td className="pt-2 pr-4 text-muted-foreground">Total</td>
                      <td className="pt-2 pr-4">{viewer.repeatVisits}×</td>
                      <td className="pt-2 pr-4">{fmtTime(viewer.timeSpent)}</td>
                      <td className="pt-2" />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Stats strip (replaces three summary cards) ──────────────────────────────

function Stat({
  icon, label, value, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="px-6 first:pl-0 last:pr-0">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
        <span className={accent}>{icon}</span>
        {label}
      </div>
      <div className="text-3xl font-semibold tracking-tight mt-2 tabular-nums">{value}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnalyticsView({ viewers }: AnalyticsViewProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  const totalTimeSpent = viewers.reduce((acc, v) => acc + v.timeSpent, 0);
  const avgTimeSpent = viewers.length > 0 ? totalTimeSpent / viewers.length : 0;
  const totalViews = viewers.reduce((acc, v) => acc + v.repeatVisits, 0);

  const pageViewData = Object.entries(
    viewers.reduce<Record<string, number>>((acc, viewer) => {
      Object.entries(viewer.pageViews).forEach(([page, views]) => {
        acc[page] = (acc[page] || 0) + views;
      });
      return acc;
    }, {})
  ).map(([page, views]) => ({ name: page, views }));

  return (
    <div className="flex flex-col gap-10 pl-12 pt-4 border-l">

      {/* ── Stats strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 divide-x divide-gray-200 border-y border-gray-200 py-6">
        <Stat
          icon={<Eye className="h-4 w-4" />}
          label="Total Views"
          value={totalViews}
          accent="text-blue-600"
        />
        <Stat
          icon={<Users className="h-4 w-4" />}
          label="Unique Viewers"
          value={viewers.length}
          accent="text-green-600"
        />
        <Stat
          icon={<Clock className="h-4 w-4" />}
          label="Avg. Time Spent"
          value={`${Math.floor(avgTimeSpent / 60)}m ${Math.round(avgTimeSpent % 60)}s`}
          accent="text-amber-600"
        />
      </div>

      {/* ── File Views chart ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between pb-4">
          <div>
            <h3 className="text-xl font-medium tracking-tight">File Views</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Open counts aggregated across all viewers.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant={chartType === 'bar' ? 'default' : 'outline'}
              onClick={() => setChartType('bar')}
              className="h-9 w-9"
              title="Bar chart"
            >
              <BarChart className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={chartType === 'pie' ? 'default' : 'outline'}
              onClick={() => setChartType('pie')}
              className="h-9 w-9"
              title="Pie chart"
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="border-t border-gray-200" />
        <div className="pt-6">
          {pageViewData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
              No file view data yet.
            </div>
          ) : (
            <ChartContainer config={{}} className="h-[280px] w-full">
              {chartType === 'bar' ? (
                <RechartsBarChart data={pageViewData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="views" fill="var(--color-primary)" radius={4} />
                </RechartsBarChart>
              ) : (
                <RechartsPieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Pie data={pageViewData} dataKey="views" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {pageViewData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              )}
            </ChartContainer>
          )}
        </div>
      </section>

      {/* ── Viewer Details table ────────────────────────────────────── */}
      <section>
        <div className="pb-4">
          <h3 className="text-xl font-medium tracking-tight">Viewer Details</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Click any row to expand per-file activity for that viewer.
          </p>
        </div>
        <div className="border-t border-gray-200" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Time Spent</TableHead>
              <TableHead>Files Opened</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Last Viewed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                  No viewer data yet.
                </TableCell>
              </TableRow>
            ) : (
              viewers.map((viewer) => (
                <ViewerRow key={viewer.email} viewer={viewer} />
              ))
            )}
          </TableBody>
        </Table>
      </section>

    </div>
  );
}
