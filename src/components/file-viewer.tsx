'use client';

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
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { supabase } from '@/lib/supabaseClient';

interface FileViewerProps {
  file: TFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Storage bucket the file lives in. Space files are in 'vdr-files';
   *  content-library / agreements default to 'documents'. */
  bucket?: string;
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

    // URL-encode (not base64) so Unicode characters in the watermark text -
    // bullets, em dashes, accented emails - work without InvalidCharacterError.
    // btoa() chokes on anything outside Latin1; encodeURIComponent handles
    // the entire Unicode range. Data URLs accept either; URL-encoded SVG is
    // also slightly smaller than the base64 equivalent.
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
  // who took it. Falls back to "Anonymous" only briefly during auth load.
  const { user } = useUser();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState('');

  useEffect(() => {
    if (!open || !file) {
      setSignedUrl(null);
      setBlobUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setError(null);
      return;
    }

    setSignedUrl(null);
    setBlobUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
    setIsLoadingUrl(true);

    // Real watermark - the signed-in user's email + today's date. No
    // placeholder "viewer@example.com" or fake IP. If the visitor manages
    // to screenshot the preview, their own email will be on the screenshot.
    const userEmail = user?.email ?? 'Anonymous';
    const currentDate = new Date().toLocaleDateString();
    setWatermarkText(`Viewed by ${userEmail}  •  ${currentDate}`);

    const fetchSignedUrl = async () => {
      try {
        if (!file.storagePath) {
          throw new Error("File storage path not available.");
        }

        const { data, error } = await supabase
          .storage
          .from(activeBucket)
          .createSignedUrl(file.storagePath, 3600);

        if (error) throw error;

        setSignedUrl(data.signedUrl);

        // Fetch as blob to avoid cross-origin iframe blocking (e.g. Brave)
        if (file.type === 'PDF') {
          const response = await fetch(data.signedUrl);
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
        }

      } catch (err) {
        console.error("Error loading file:", err);
        setError("Could not load file.");
        toast({
          variant: "destructive",
          title: "Error loading file",
          description: "The file could not be loaded.",
        });
      } finally {
        setIsLoadingUrl(false);
      }
    };

    fetchSignedUrl();
    // user?.email is in deps so the watermark refreshes if auth resolves
    // after the dialog opens (e.g. cold load → user loads → email appears).
  }, [file, open, toast, user?.email]);

  const handleDownload = async () => {
    if (!signedUrl) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "File content is not available.",
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
      console.error("Download failed:", err);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not download the file.",
      });
    }
  };

  const renderContent = () => {
    if (isLoadingUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error || !signedUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-4 p-8">
          <FileWarning className="h-12 w-12" />
          <p className="text-lg font-medium">Preview not available</p>
          <Button onClick={handleDownload} disabled={!signedUrl}>
            <Download className="mr-2 h-4 w-4" />
            Download {file?.name}
          </Button>
        </div>
      );
    }

    if (file?.type === 'Image') {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={signedUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    if (file?.type === 'PDF') {
      return blobUrl ? (
        <iframe
          src={blobUrl}
          className="w-full h-full"
          title={file.name}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    // Video files (mp4/webm/mov/…). The File.type union has no 'Video', so we
    // detect by extension and stream the signed URL directly into a player.
    if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(file?.name ?? '')) {
      return (
        <div className="flex items-center justify-center h-full bg-black p-2">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={signedUrl} controls className="max-h-full max-w-full">
            Your browser does not support video playback.
          </video>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-4 p-8">
        <FileWarning className="h-12 w-12" />
        <p className="text-lg font-medium">Preview not available</p>
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download {file?.name}
        </Button>
      </div>
    );
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