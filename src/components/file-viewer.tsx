'use client';

/**
 * FileViewer - the in-app preview dialog (Content Library, sidebar, agreements).
 *
 * Renders EVERY common file type, on every device:
 *   - PDF    -> canvas PdfViewer (pdf.js). The old blob-iframe approach showed
 *               nothing on phones and depended on file.type being exactly
 *               'PDF', which DB rows often are not. Detection is now by
 *               file EXTENSION first, stored type second.
 *   - Images -> <img>
 *   - Video  -> <video>, Audio -> <audio>
 *   - Text   -> fetched and rendered inline (txt/csv/md/json/xml/log)
 *   - Office -> Microsoft's embed viewer (doc/docx/xls/xlsx/ppt/pptx)
 *   - Other  -> download fallback, never a dead end
 *
 * Every preview is overlaid with a watermark naming the signed-in viewer.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type File as TFile } from '@/lib/folder-provider';
import {
  Download,
  Loader2,
  FileWarning
} from 'lucide-react';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { supabase } from '@/lib/supabaseClient';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface FileViewerProps {
  file: TFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Storage bucket the file lives in. Space files are in 'vdr-files';
   *  content-library / agreements default to 'documents'. */
  bucket?: string;
}

type PreviewKind = 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'office' | 'other';

/** Extension first (most reliable), stored type string second. */
function detectKind(name: string, type: string): PreviewKind {
  const ext = (name.split('.').pop() ?? '').toLowerCase().trim();
  const t = (type ?? '').toLowerCase();
  const is = (...xs: string[]) => xs.includes(ext);

  if (is('pdf') || t === 'pdf') return 'pdf';
  if (is('png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif', 'heic') || t === 'image') return 'image';
  if (is('mp4', 'webm', 'mov', 'm4v', 'mkv', 'avi', 'ogg')) return 'video';
  if (is('mp3', 'wav', 'm4a', 'aac', 'flac')) return 'audio';
  if (is('txt', 'csv', 'md', 'json', 'xml', 'log', 'yml', 'yaml')) return 'text';
  if (is('doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx')) return 'office';
  return 'other';
}

const Watermark = ({ text }: { text: string }) => {
  const watermarkStyle = useMemo(() => {
    if (typeof window === 'undefined') return {};

    // Escape XML special chars so an email like a&b@c won't break the SVG.
    const safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'>
                   <text
                     x='50%'
                     y='50%'
                     font-size='16'
                     fill='black'
                     fill-opacity='0.15'
                     transform='rotate(-45, 150, 100)'
                     text-anchor='middle'
                     dominant-baseline='middle'
                   >
                     ${safe}
                   </text>
                 </svg>`;

    // URL-encode (not base64) so Unicode characters in the watermark text
    // work without InvalidCharacterError.
    const dataUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

    return {
      backgroundImage: dataUrl,
      backgroundRepeat: 'repeat' as const,
    };
  }, [text]);

  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none"
      style={watermarkStyle}
    />
  );
};

const STORAGE_BUCKET = 'documents';

export function FileViewer({ file, open, onOpenChange, bucket }: FileViewerProps) {
  const activeBucket = bucket || STORAGE_BUCKET;
  const { toast } = useToast();
  // Watermark identifies the *current logged-in user* on every preview -
  // discourages screenshot-and-leak because the screenshot itself shows
  // who took it.
  const { user } = useUser();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState('');

  const kind: PreviewKind = file ? detectKind(file.name ?? '', String(file.type ?? '')) : 'other';

  useEffect(() => {
    if (!open || !file) {
      setSignedUrl(null);
      setTextContent(null);
      setError(null);
      return;
    }

    setSignedUrl(null);
    setTextContent(null);
    setError(null);
    setIsLoadingUrl(true);

    const userEmail = user?.email ?? 'Anonymous';
    const currentDate = new Date().toLocaleDateString();
    setWatermarkText(`Viewed by ${userEmail}  •  ${currentDate}`);

    let cancelled = false;
    const fetchSignedUrl = async () => {
      try {
        if (!file.storagePath) {
          throw new Error('File storage path not available.');
        }

        const { data, error } = await supabase
          .storage
          .from(activeBucket)
          .createSignedUrl(file.storagePath, 3600);

        if (error) throw error;
        if (cancelled) return;

        setSignedUrl(data.signedUrl);

        // Text files: fetch the content so it can render inline.
        if (detectKind(file.name ?? '', String(file.type ?? '')) === 'text') {
          try {
            const res = await fetch(data.signedUrl);
            if (res.ok) {
              const t = await res.text();
              if (!cancelled) setTextContent(t.slice(0, 500_000));
            }
          } catch { /* falls through to download UI */ }
        }
      } catch (err) {
        console.error('Error loading file:', err);
        if (!cancelled) {
          setError('Could not load file.');
          toast({
            variant: 'destructive',
            title: 'Error loading file',
            description: 'The file could not be loaded.',
          });
        }
      } finally {
        if (!cancelled) setIsLoadingUrl(false);
      }
    };

    fetchSignedUrl();
    return () => { cancelled = true; };
    // user?.email is in deps so the watermark refreshes if auth resolves
    // after the dialog opens.
  }, [file, open, toast, user?.email, activeBucket]);

  const handleDownload = async () => {
    if (!signedUrl) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: 'File content is not available.',
      });
      return;
    }

    try {
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file?.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: 'Could not download the file.',
      });
    }
  };

  const DownloadFallback = ({ note }: { note?: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-4 p-8">
      <FileWarning className="h-12 w-12" />
      <p className="text-lg font-medium">Preview not available</p>
      {note && <p className="text-sm max-w-sm">{note}</p>}
      <Button onClick={handleDownload} disabled={!signedUrl}>
        <Download className="mr-2 h-4 w-4" />
        Download {file?.name}
      </Button>
    </div>
  );

  const renderContent = () => {
    if (isLoadingUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error || !signedUrl) {
      return <DownloadFallback />;
    }

    switch (kind) {
      case 'pdf':
        // Canvas rendering (pdf.js) - works on phones, where iframes cannot
        // display PDFs at all.
        return <PdfViewer url={signedUrl} />;

      case 'image':
        return (
          <div className="flex items-center justify-center h-full p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signedUrl}
              alt={file?.name ?? ''}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center h-full bg-black p-2">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={signedUrl} controls playsInline className="max-h-full max-w-full">
              Your browser does not support video playback.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center justify-center h-full p-6">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio src={signedUrl} controls className="w-full max-w-xl" />
          </div>
        );

      case 'text':
        return textContent === null ? (
          <DownloadFallback note="This file could not be read as text." />
        ) : (
          <div className="h-full w-full overflow-auto bg-white">
            <pre className="whitespace-pre-wrap break-words p-4 font-mono text-sm text-gray-900">
              {textContent}
            </pre>
          </div>
        );

      case 'office':
        // Word / Excel / PowerPoint render through Microsoft's embed viewer
        // (frame-src whitelisted in next.config.ts). The signed URL is
        // publicly fetchable for the hour it lives.
        return (
          <iframe
            title={file?.name ?? 'Document'}
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`}
            className="w-full h-full border-0 bg-white"
          />
        );

      default:
        return (
          <DownloadFallback
            note={`Files of this type (${(file?.name.split('.').pop() ?? 'unknown').toLowerCase()}) can't be shown inline yet.`}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="truncate pr-8">
            {file?.name || 'File Viewer'}
          </DialogTitle>

          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            disabled={!signedUrl || isLoadingUrl}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
          {file ? renderContent() : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {signedUrl && <Watermark text={watermarkText} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
