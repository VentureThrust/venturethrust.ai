'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const OVERLAY_ID = 'vt-overlay';
const SHOW_DELAY_MS = 250; // only show overlay if navigation takes longer than this

export function NavigationLoader() {
  const pathname = usePathname();

  // On every pathname change, immediately hide the overlay AND cancel any
  // pending show-timer. This prevents the brief "dark flash" on back nav:
  // client-side route transitions in App Router complete in well under
  // SHOW_DELAY_MS, so the overlay never actually appears.
  useEffect(() => {
    const w = window as unknown as { __vtOverlayTimer?: ReturnType<typeof setTimeout> | null };
    if (w.__vtOverlayTimer) {
      clearTimeout(w.__vtOverlayTimer);
      w.__vtOverlayTimer = null;
    }
    const el = document.getElementById(OVERLAY_ID);
    if (el) el.style.opacity = '0';
  }, [pathname]);

  useEffect(() => {
    if (!document.getElementById(OVERLAY_ID)) {
      const el = document.createElement('div');
      el.id = OVERLAY_ID;
      el.style.position = 'fixed';
      el.style.inset = '0';
      el.style.zIndex = '99999';
      el.style.background = 'rgba(0,0,0,0.25)';
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      el.style.transition = 'opacity 0.15s ease';
      document.body.appendChild(el);
    }

    const w = window as unknown as { __vtOverlayTimer?: ReturnType<typeof setTimeout> | null };

    const scheduleShow = () => {
      if (w.__vtOverlayTimer) clearTimeout(w.__vtOverlayTimer);
      w.__vtOverlayTimer = setTimeout(() => {
        const el = document.getElementById(OVERLAY_ID);
        if (el) el.style.opacity = '1';
        w.__vtOverlayTimer = null;
      }, SHOW_DELAY_MS);
    };

    const cancelOverlay = () => {
      if (w.__vtOverlayTimer) {
        clearTimeout(w.__vtOverlayTimer);
        w.__vtOverlayTimer = null;
      }
      const el = document.getElementById(OVERLAY_ID);
      if (el) el.style.opacity = '0';
    };

    const originalPush = window.history.pushState.bind(window.history);
    window.history.pushState = function (state, title, url) {
      const newPath = typeof url === 'string' ? url.split('?')[0] : null;
      if (newPath && newPath !== window.location.pathname) {
        // Schedule show, but the pathname-change effect above will cancel it
        // when the new route finishes mounting (typically < 100ms).
        scheduleShow();
      }
      return originalPush(state, title, url);
    };

    // Browser back/forward triggers popstate, not pushState. Make sure the
    // overlay never appears for back-navigation.
    const onPopstate = () => cancelOverlay();
    window.addEventListener('popstate', onPopstate);

    return () => {
      window.history.pushState = originalPush;
      window.removeEventListener('popstate', onPopstate);
      cancelOverlay();
    };
  }, []);

  return null;
}
