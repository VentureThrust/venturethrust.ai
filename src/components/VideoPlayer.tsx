'use client';

/**
 * VideoPlayer - HTML5 video wrapper that emits granular playback events.
 *
 * Tracks:
 *  - 'play'       : user pressed play (position = where playback started)
 *  - 'pause'      : user paused (position = where they paused)
 *  - 'seek'       : user jumped to a different timestamp (range_start = from, range_end = to)
 *  - 'segment'    : a contiguous watched range (range_start..range_end)
 *  - 'replay'     : user jumped backward in the timeline (range_start = from, range_end = to)
 *  - 'ended'      : video finished playing through to its end
 *
 * Replay detection: if a seek event lands at a timestamp earlier than the
 * current position, we emit BOTH 'seek' AND 'replay' so the analytics UI can
 * mark these on the timeline. Forward jumps just emit 'seek'.
 *
 * The analytics page aggregates these into a "watched seconds" heatmap and
 * shows replay markers exactly like DocSend.
 */

import { useEffect, useRef } from 'react';

export type PlaybackEvent =
  | { type: 'play'; position: number }
  | { type: 'pause'; position: number }
  | { type: 'seek'; range_start: number; range_end: number }
  | { type: 'replay'; range_start: number; range_end: number }
  | { type: 'segment'; range_start: number; range_end: number }
  | { type: 'ended'; position: number };

interface VideoPlayerProps {
  url: string;
  mimeType?: string;
  className?: string;
  onPlaybackEvent?: (event: PlaybackEvent) => void;
}

export function VideoPlayer({ url, mimeType, className, onPlaybackEvent }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Keep onPlaybackEvent in a ref so listeners don't re-attach on parent re-renders.
  const cbRef = useRef(onPlaybackEvent);
  useEffect(() => {
    cbRef.current = onPlaybackEvent;
  }, [onPlaybackEvent]);

  // Refs (not state) for high-frequency tracking that doesn't need re-renders.
  // - segmentStart: when the current "playing segment" began, in video seconds
  // - lastTime:     last currentTime we observed via timeupdate
  // - seekingFrom:  if true, currentTime BEFORE the seek (set on 'seeking' event)
  const segmentStartRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const seekingFromRef = useRef<number | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const fire = (e: PlaybackEvent) => {
      try {
        cbRef.current?.(e);
      } catch (err) {
        console.error('Playback event handler threw:', err);
      }
    };

    const flushSegment = (endAt: number) => {
      const start = segmentStartRef.current;
      if (start === null) return;
      // Ignore micro-segments (≤ 0.5 sec - usually just a momentary pause/seek)
      if (endAt - start > 0.5) {
        fire({ type: 'segment', range_start: start, range_end: endAt });
      }
      segmentStartRef.current = null;
    };

    const onPlay = () => {
      segmentStartRef.current = v.currentTime;
      fire({ type: 'play', position: v.currentTime });
    };

    const onPause = () => {
      flushSegment(v.currentTime);
      fire({ type: 'pause', position: v.currentTime });
    };

    const onSeeking = () => {
      // Capture the position we're seeking FROM
      seekingFromRef.current = lastTimeRef.current;
      // Flush the segment that ended at the pre-seek position
      flushSegment(lastTimeRef.current);
    };

    const onSeeked = () => {
      const from = seekingFromRef.current ?? v.currentTime;
      const to = v.currentTime;
      seekingFromRef.current = null;

      if (Math.abs(to - from) < 0.1) return; // ignore tiny adjustments

      // Always fire 'seek' for any jump
      fire({ type: 'seek', range_start: from, range_end: to });

      // If they jumped BACKWARD by more than 1s, that's a replay
      if (from - to > 1) {
        fire({ type: 'replay', range_start: from, range_end: to });
      }

      // If still playing, start a new segment from the new position
      if (!v.paused) {
        segmentStartRef.current = to;
      }
    };

    const onTimeUpdate = () => {
      lastTimeRef.current = v.currentTime;
    };

    const onEnded = () => {
      flushSegment(v.duration);
      fire({ type: 'ended', position: v.duration });
    };

    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('seeking', onSeeking);
    v.addEventListener('seeked', onSeeked);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('ended', onEnded);

    return () => {
      // Flush final segment if user closes mid-playback
      if (segmentStartRef.current !== null) {
        flushSegment(v.currentTime);
      }
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('seeking', onSeeking);
      v.removeEventListener('seeked', onSeeked);
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('ended', onEnded);
    };
  }, [url]);

  return (
    <video
      ref={videoRef}
      key={url}
      controls
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      className={className ?? 'max-w-full max-h-full w-full'}
      onContextMenu={(e) => e.preventDefault()}
    >
      <source src={url} type={mimeType} />
      Your browser does not support the video tag.
    </video>
  );
}
