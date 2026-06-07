'use client';

/**
 * ModalLockWatchdog
 *
 * Safety net for a well-known Radix UI bug: when a Dialog/Sheet is opened from
 * inside a DropdownMenu/ContextMenu (or two modal layers race on open/close),
 * Radix can leave the page in a "locked" state even though nothing is open:
 *   - `document.body` keeps inline `pointer-events: none`
 *   - the app wrapper keeps `aria-hidden="true"` / `data-aria-hidden`
 * The result is the ENTIRE page becomes unclickable ("frozen").
 *
 * This watchdog watches `<body>` for the lock being applied and, a short moment
 * later, verifies a real modal layer is actually open. If the body is locked but
 * NO Radix modal/popper layer exists, it clears the stuck lock.
 *
 * It is intentionally conservative: it NEVER touches anything while a real
 * dialog, alert-dialog, menu, popover or select is open, so it cannot break a
 * legitimately-open modal.
 */

import { useEffect } from 'react';

// Selectors for Radix layers that legitimately lock the body. If ANY of these
// exist, the lock is real and we leave it completely alone.
const OPEN_LAYER_SELECTOR = [
  '[role="dialog"][data-state="open"]',
  '[role="alertdialog"][data-state="open"]',
  '[data-radix-popper-content-wrapper]', // dropdown / popover / select / combobox
  '[data-radix-menu-content][data-state="open"]',
].join(',');

function anyLayerOpen(): boolean {
  return !!document.querySelector(OPEN_LAYER_SELECTOR);
}

function bodyLocked(): boolean {
  const b = document.body;
  return b.style.pointerEvents === 'none' || b.hasAttribute('data-scroll-locked');
}

function clearStuckLock(): void {
  if (anyLayerOpen()) return; // a real modal is open - never touch it
  const b = document.body;
  if (b.style.pointerEvents === 'none') b.style.removeProperty('pointer-events');
  b.removeAttribute('data-scroll-locked');
  // Radix's aria-hidden helper tags everything it hid with `data-aria-hidden`,
  // so clearing only those is safe (we won't strip app-authored aria-hidden).
  document.querySelectorAll('[data-aria-hidden]').forEach((el) => {
    el.removeAttribute('aria-hidden');
    el.removeAttribute('data-aria-hidden');
  });
}

export function ModalLockWatchdog() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (timer) clearTimeout(timer);
      // Wait past any open/close transition before deciding the lock is stuck.
      timer = setTimeout(() => {
        if (bodyLocked()) clearStuckLock();
      }, 600);
    };

    // Radix toggles the lock by mutating <body>'s style / attributes.
    const obs = new MutationObserver(schedule);
    obs.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked'],
    });

    // Belt-and-suspenders: re-check when the tab/window regains focus.
    const recheck = () => schedule();
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);

    return () => {
      if (timer) clearTimeout(timer);
      obs.disconnect();
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, []);

  return null;
}
