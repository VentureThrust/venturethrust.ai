'use client';

/**
 * UploadProgressPanel - the bottom-right "Uploads" card that tracks per-file
 * upload progress (tabs: All / Completed / In progress / Failed), with an
 * overall status footer, minimise, and close. Paired with useUploadTracker(),
 * which holds the item list and auto-dismisses 30s after everything finishes.
 *
 * Originally inline in the Content Library; extracted so the space editor (and
 * anywhere else) shows the same tracker instead of a single end-of-upload toast.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Minus, X, Loader2, CheckCircle2, XCircle, Upload, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type UploadStatus = 'in_progress' | 'completed' | 'failed';

export interface UploadItem {
  id: string;
  name: string;
  type: string;
  progress: number;
  status: UploadStatus;
  fileId?: string;
  contentUrl?: string;
}

type UploadTab = 'all' | 'completed' | 'in_progress' | 'failed';

const AUTO_HIDE_MS = 30_000;

/** Holds the upload list + visibility; auto-hides 30s after nothing is in progress. */
export function useUploadTracker() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const clearTimer = () => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const addItems = useCallback((newItems: UploadItem[]) => {
    if (newItems.length === 0) return;
    clearTimer();
    setItems((prev) => [...prev, ...newItems]);
    setVisible(true);
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const close = useCallback(() => {
    clearTimer();
    setVisible(false);
    setItems([]);
  }, []);

  useEffect(() => {
    if (!visible || items.length === 0) return;
    if (items.some((i) => i.status === 'in_progress')) {
      clearTimer();
      return;
    }
    clearTimer();
    hideTimer.current = window.setTimeout(() => {
      setVisible(false);
      setItems([]);
    }, AUTO_HIDE_MS);
    return clearTimer;
  }, [items, visible]);

  useEffect(() => clearTimer, []);

  return { items, visible, addItems, updateItem, close };
}

export function UploadProgressPanel({
  items,
  onClose,
  onView,
}: {
  items: UploadItem[];
  onClose: () => void;
  onView?: (item: UploadItem) => void;
}) {
  const [minimized, setMinimized] = useState(false);
  const [tab, setTab] = useState<UploadTab>('all');

  const filtered = useMemo(() => (tab === 'all' ? items : items.filter((i) => i.status === tab)), [items, tab]);

  const inProgressCount = items.filter((i) => i.status === 'in_progress').length;
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const failedCount = items.filter((i) => i.status === 'failed').length;

  const overallProgress = useMemo(() => {
    if (!items.length) return 0;
    return Math.round(items.reduce((s, i) => s + i.progress, 0) / items.length);
  }, [items]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl bg-gray-900 text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
        <span className="text-base font-semibold">Uploads</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized((v) => !v)} className="rounded p-1.5 transition-colors hover:bg-gray-700">
            <Minus className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="rounded p-1.5 transition-colors hover:bg-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="flex items-center gap-1 px-3 pb-1 pt-3">
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'completed', label: 'Completed' },
                { key: 'in_progress', label: 'In progress' },
                { key: 'failed', label: 'Failed' },
              ] as { key: UploadTab; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  tab === key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex max-h-56 flex-col gap-2 overflow-y-auto px-3 py-2">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">No uploads in this category.</p>
            ) : (
              filtered.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg bg-gray-800 px-3 py-2.5">
                  <div className="shrink-0">
                    {item.status === 'in_progress' && <Loader2 className="h-5 w-5 animate-spin text-blue-400" />}
                    {item.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                    {item.status === 'failed' && <XCircle className="h-5 w-5 text-red-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-xs uppercase text-gray-400">{item.type}</p>
                    {item.status === 'in_progress' && (
                      <div className="mt-1.5 space-y-1">
                        <Progress value={item.progress} className="h-1.5 bg-gray-700 [&>div]:bg-blue-500" />
                        <p className="text-xs text-gray-400">{item.progress}% uploaded</p>
                      </div>
                    )}
                    {item.status === 'failed' && (
                      <p className="mt-0.5 text-xs text-red-400">Upload failed. Please try again.</p>
                    )}
                  </div>
                  {item.status === 'completed' && item.fileId && onView && (
                    <button
                      onClick={() => onView(item)}
                      className="shrink-0 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-blue-700"
                    >
                      View
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {inProgressCount > 0 && (
            <div className="mt-1 flex items-center gap-3 bg-blue-700 px-4 py-3">
              <Upload className="h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  Processing {inProgressCount} item{inProgressCount > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-blue-200">Some items are still uploading, {overallProgress}% overall</p>
              </div>
            </div>
          )}
          {inProgressCount === 0 && completedCount > 0 && failedCount === 0 && (
            <div className="mt-1 flex items-center gap-3 bg-green-700 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">All uploads complete</p>
                <p className="text-xs text-green-200">
                  {completedCount} file{completedCount > 1 ? 's' : ''} uploaded successfully
                </p>
              </div>
            </div>
          )}
          {failedCount > 0 && inProgressCount === 0 && (
            <div className="mt-1 flex items-center gap-3 bg-red-700 px-4 py-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {failedCount} upload{failedCount > 1 ? 's' : ''} failed
                </p>
                <p className="text-xs text-red-200">Please try uploading again</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
