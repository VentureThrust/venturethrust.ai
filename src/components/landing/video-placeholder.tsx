'use client';

/**
 * <VideoPlaceholder> - drop-in component for product-demo videos.
 *
 * If `src` is provided (mp4 URL, YouTube embed, Vimeo, etc.) it renders the
 * actual video. If not, it shows a beautiful styled placeholder with a
 * play button + label, so the landing page looks intentional while videos
 * are being produced.
 *
 * To switch a placeholder to a real video, just pass the URL:
 *   <VideoPlaceholder src="/videos/demo.mp4" label="Product walkthrough" />
 *
 * Supports:
 *   - Direct video files (mp4, webm) → <video> element
 *   - YouTube/Vimeo URLs → <iframe>
 *   - Empty/placeholder → styled gradient with play icon
 */

import { Play, Video } from 'lucide-react';

interface VideoPlaceholderProps {
  src?: string;
  poster?: string;
  /** Caption shown on the placeholder when src is empty. */
  label?: string;
  /** Aspect ratio: '16/9' (default) or '4/3' or '1/1' */
  aspect?: '16/9' | '4/3' | '1/1';
  /** Tint gradient for placeholder. Cycle these across the page for variety. */
  tone?: 'blue' | 'purple' | 'indigo' | 'slate';
  className?: string;
}

const TONE_GRADIENTS: Record<NonNullable<VideoPlaceholderProps['tone']>, string> = {
  blue: 'from-blue-600 via-blue-700 to-indigo-800',
  purple: 'from-purple-600 via-purple-700 to-fuchsia-800',
  indigo: 'from-indigo-600 via-indigo-700 to-blue-900',
  slate: 'from-slate-700 via-slate-800 to-slate-900',
};

const ASPECT_CLASSES: Record<NonNullable<VideoPlaceholderProps['aspect']>, string> = {
  '16/9': 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
};

function isYouTube(url: string): string | null {
  // youtube.com/watch?v=ID  •  youtu.be/ID  •  youtube.com/embed/ID
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function isVimeo(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function VideoPlaceholder({
  src,
  poster,
  label = 'Product demo coming soon',
  aspect = '16/9',
  tone = 'blue',
  className = '',
}: VideoPlaceholderProps) {
  const aspectClass = ASPECT_CLASSES[aspect];
  const baseShell = `relative w-full overflow-hidden rounded-2xl shadow-2xl ${aspectClass} ${className}`;

  // ── Real video provided ────────────────────────────────────────────────
  if (src) {
    const yt = isYouTube(src);
    const vimeo = isVimeo(src);

    if (yt) {
      return (
        <div className={baseShell}>
          <iframe
            src={`https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1`}
            title={label}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    if (vimeo) {
      return (
        <div className={baseShell}>
          <iframe
            src={`https://player.vimeo.com/video/${vimeo}?title=0&byline=0&portrait=0`}
            title={label}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Direct file: mp4 / webm / etc.
    return (
      <div className={`${baseShell} bg-black`}>
        <video
          src={src}
          poster={poster}
          controls
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    );
  }

  // ── Placeholder ────────────────────────────────────────────────────────
  return (
    <div
      className={`${baseShell} bg-gradient-to-br ${TONE_GRADIENTS[tone]} flex items-center justify-center group cursor-pointer`}
      role="img"
      aria-label={label}
    >
      {/* Decorative diagonal stripes */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 24px)',
        }}
      />
      {/* Faint vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

      {/* Center play button + label */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-white px-6 text-center">
        <div className="h-20 w-20 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/25 transition-colors">
          <Play className="h-9 w-9 fill-white ml-1" />
        </div>
        <div>
          <p className="text-lg font-semibold">{label}</p>
          <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5 justify-center">
            <Video className="h-3 w-3" />
            Video placeholder - replace via src prop
          </p>
        </div>
      </div>

      {/* Top-right "DEMO" sticker */}
      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-white/15 backdrop-blur-sm border border-white/20 text-[10px] font-bold uppercase tracking-wider text-white">
        Demo
      </div>
    </div>
  );
}
