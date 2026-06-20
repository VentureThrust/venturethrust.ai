'use client';

/**
 * SharedFileView - renders a SINGLE file for a file-scoped share link, after the
 * gates (email/password/NDA/etc.) have passed. The signed URL is fetched by
 * GatesFlow from /api/share-links/validate, which only returns it once every
 * server-side gate has cleared - so the URL never reaches an unauthorized
 * visitor. ScreenGuard (mounted on all /shared routes) adds the right-click /
 * copy / print / screenshot deterrents on top.
 */

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SharedFile {
  id: string;
  name: string;
  type: string;
  url: string;
  watermarkText: string | null;
  allowDownload: boolean;
}

export function SharedFileView({ file }: { file: SharedFile }) {
  const isPdf = /pdf/i.test(file.type) || /\.pdf(\?|$)/i.test(file.url);
  const isImage =
    /image|png|jpe?g|gif|webp|svg/i.test(file.type) || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(file.url);

  return (
    <div className="relative flex h-screen w-full flex-col bg-gray-900">
      <header className="flex items-center justify-between gap-3 border-b border-gray-800 bg-gray-950 px-4 py-3 text-white">
        <span className="truncate text-sm font-medium">{file.name}</span>
        {file.allowDownload ? (
          <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </a>
        ) : (
          <span className="text-xs text-gray-400">Downloads disabled</span>
        )}
      </header>

      <div className="relative flex-1 overflow-hidden">
        {isPdf ? (
          <iframe
            title={file.name}
            // toolbar=0 hides the browser PDF toolbar (download/print) when
            // downloads are disabled. Not bulletproof, but a reasonable deterrent
            // alongside ScreenGuard.
            src={`${file.url}#toolbar=${file.allowDownload ? '1' : '0'}`}
            className="h-full w-full border-0"
          />
        ) : isImage ? (
          <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.url} alt={file.name} className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-gray-300">
            <p className="text-sm">A preview isn&apos;t available for this file type.</p>
            {file.allowDownload && (
              <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download to view
                </Button>
              </a>
            )}
          </div>
        )}

        {file.watermarkText && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-wrap content-center justify-center gap-x-16 gap-y-24 overflow-hidden opacity-20">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="rotate-[-30deg] whitespace-nowrap text-2xl font-bold text-gray-500 select-none"
              >
                {file.watermarkText}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
