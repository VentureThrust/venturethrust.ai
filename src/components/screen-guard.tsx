'use client';

/**
 * ScreenGuard: DocSend-style protection for the DOCUMENT-VIEWING experience.
 *
 * A browser cannot truly block screenshots (the OS takes them), so the real
 * protection is the dynamic watermark on the document. This adds the same
 * deterrent layer DocSend applies to a shared link: it blocks right-click,
 * copy, cut, drag, and printing; wipes the clipboard and warns on PrintScreen;
 * and blanks the screen the moment the window loses focus.
 *
 * It is ACTIVE ONLY on document-viewing routes (shared links, the file viewer,
 * the space viewer), exactly like DocSend. Your own dashboard and editor stay
 * completely normal. Mounted once in the root layout; it self-gates by URL.
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { EyeOff } from 'lucide-react';

const isProtectedRoute = (path: string): boolean =>
  path.startsWith('/shared') ||
  path.startsWith('/view') ||
  /^\/spaces\/[^/]+\/view/.test(path);

export function ScreenGuard() {
  const pathname = usePathname() || '';
  const active = isProtectedRoute(pathname);
  const [obscured, setObscured] = useState(false);
  const [warn, setWarn] = useState(false);

  useEffect(() => {
    if (!active) return;

    // Marks the page so the companion CSS (no-select, blank-on-print) applies.
    document.body.classList.add('vt-protected');

    let warnTimer: ReturnType<typeof setTimeout> | undefined;
    const flash = () => {
      setWarn(true);
      if (warnTimer) clearTimeout(warnTimer);
      warnTimer = setTimeout(() => setWarn(false), 2200);
    };

    const prevent = (e: Event) => e.preventDefault();
    const wipeClipboard = () => {
      try {
        navigator.clipboard?.writeText('');
      } catch {
        /* clipboard API may be blocked; nothing more we can do */
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        wipeClipboard();
        flash();
        return;
      }
      const k = (e.key ?? '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === 'p' || k === 's')) {
        e.preventDefault();
        flash();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        wipeClipboard();
        flash();
      }
    };

    const hide = () => {
      // Ignore a blur caused by focus entering an in-page iframe (embedded video).
      if (document.activeElement && document.activeElement.tagName === 'IFRAME') return;
      setObscured(true);
    };
    const show = () => setObscured(false);
    const onVis = () => setObscured(document.hidden);

    document.addEventListener('contextmenu', prevent);
    document.addEventListener('copy', prevent);
    document.addEventListener('cut', prevent);
    document.addEventListener('dragstart', prevent);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', hide);
    window.addEventListener('focus', show);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeprint', hide);
    window.addEventListener('afterprint', show);

    return () => {
      document.body.classList.remove('vt-protected');
      setObscured(false);
      if (warnTimer) clearTimeout(warnTimer);
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('copy', prevent);
      document.removeEventListener('cut', prevent);
      document.removeEventListener('dragstart', prevent);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', hide);
      window.removeEventListener('focus', show);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeprint', hide);
      window.removeEventListener('afterprint', show);
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      {obscured && (
        <div
          className="fixed inset-0 z-[2147483647] flex flex-col items-center justify-center gap-3 bg-gray-950 text-white"
          aria-hidden="true"
        >
          <EyeOff className="h-10 w-10 text-gray-400" />
          <p className="text-lg font-semibold">Content hidden</p>
          <p className="text-sm text-gray-400">Return to this tab to keep viewing.</p>
        </div>
      )}
      {warn && (
        <div className="fixed left-1/2 top-5 z-[2147483647] -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-2xl">
          This document is protected. Screenshots, printing, and copying are disabled.
        </div>
      )}
    </>
  );
}
