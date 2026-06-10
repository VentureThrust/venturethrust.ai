'use client';

/**
 * ProductTour - a DocSend-style guided tour that runs on the LIVE page. It dims
 * the screen, spotlights a real element (a nav item or button), and shows a
 * tooltip explaining what it does. A real interface walkthrough, not pictures.
 *
 * Steps target real elements by CSS selector (e.g. `[href="/spaces"]` or
 * `[data-tour="spaces-create"]`). A step with no selector renders a centered
 * card (good for a welcome step). Missing targets are skipped.
 *
 * Showing rules:
 *   - Runs once per user, gated by localStorage `vt_tour_<tourKey>`.
 *   - Add `?tour=1` to the URL to force it (testing / a "replay tour" link).
 *   - The "seen" flag is only written when the user Skips or finishes, never
 *     when a target merely isn't on the page, so a transient miss can't disable
 *     the tour forever.
 */

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export type TourStep = {
  /** CSS selector of the element to spotlight. Omit for a centered card. */
  selector?: string;
  title: string;
  description: string;
};

const seenKey = (k: string) => `vt_tour_${k}`;
const TOOLTIP_W = 320;

export function ProductTour({ tourKey, steps }: { tourKey: string; steps: TourStep[] }) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => setMounted(true), []);

  // Start once per user. `?tour=1` forces it regardless of the saved flag.
  useEffect(() => {
    let force = false;
    try {
      force = new URLSearchParams(window.location.search).get('tour') === '1';
    } catch {
      /* ignore */
    }
    if (!force) {
      try {
        if (window.localStorage.getItem(seenKey(tourKey))) return;
      } catch {
        return;
      }
    }
    const t = setTimeout(() => setActive(true), 600);
    return () => clearTimeout(t);
  }, [tourKey]);

  // Close AND remember (the user explicitly skipped or finished).
  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(seenKey(tourKey), '1');
    } catch {
      /* ignore */
    }
    setActive(false);
  }, [tourKey]);

  // Close WITHOUT remembering (none of the remaining targets exist yet), so the
  // tour can try again next time.
  const endSilently = useCallback(() => setActive(false), []);

  // Stable primitive deps so an inline `steps` array can't cause a render loop.
  const stepCount = steps.length;
  const activeSelector = steps[idx]?.selector;

  // Resolve + measure the current target (or skip it if missing).
  useEffect(() => {
    if (!active) return;
    if (idx >= stepCount) {
      dismiss();
      return;
    }
    if (!activeSelector) {
      setRect(null); // centered step (e.g. the welcome card)
      return;
    }
    const el = document.querySelector(activeSelector) as HTMLElement | null;
    if (!el) {
      if (idx < stepCount - 1) setIdx((i) => i + 1);
      else endSilently();
      return;
    }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const measure = () => setRect(el.getBoundingClientRect());
    measure();
    const t = setTimeout(measure, 350); // settle after smooth scroll
    const onWin = () => measure();
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [active, idx, activeSelector, stepCount, dismiss, endSilently]);

  // Escape to skip.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, dismiss]);

  const goNext = () => {
    if (idx >= stepCount - 1) dismiss();
    else setIdx((i) => i + 1);
  };
  const goBack = () => setIdx((i) => Math.max(0, i - 1));

  if (!mounted || !active) return null;
  const step = steps[idx];
  if (!step) return null;

  const isLast = idx === stepCount - 1;
  const pad = 8;
  const spot = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  let tooltipStyle: React.CSSProperties;
  if (spot) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = spot.left + spot.width + 16;
    if (left + TOOLTIP_W > vw - 12) left = Math.max(12, spot.left - TOOLTIP_W - 16);
    const top = Math.min(Math.max(12, spot.top), vh - 240);
    tooltipStyle = { position: 'fixed', top, left, width: TOOLTIP_W };
  } else {
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: TOOLTIP_W,
    };
  }

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      {/* Click blocker keeps the user on the guided path. */}
      <div className="absolute inset-0" />

      {/* Spotlight (a box at the target with a huge surrounding shadow), or a
          plain dim layer for centered steps. */}
      {spot ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-white/80 transition-all duration-300"
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            boxShadow: '0 0 0 9999px rgba(15,23,42,0.66)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/70" />
      )}

      {/* Tooltip card */}
      <div
        style={tooltipStyle}
        className="z-[121] rounded-xl border border-gray-100 bg-white p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {idx + 1} of {stepCount}
          </span>
          <button
            onClick={dismiss}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Skip
          </button>
        </div>

        <h3 className="mt-2 text-lg font-bold tracking-tight text-foreground">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>

        <div className="mt-4 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? 'w-5 bg-gray-900' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={goBack} className={idx === 0 ? 'invisible' : ''}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button size="sm" onClick={goNext} className="bg-gray-900 text-white hover:bg-gray-800">
            {isLast ? 'Done' : 'Next'}
            {!isLast && <ArrowRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
