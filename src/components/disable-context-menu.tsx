'use client';

import { useEffect } from 'react';

/**
 * Disables right-click (context menu) across the ENTIRE site. This is a deterrent
 * against casual saving/copying of content, NOT a security control - dev tools,
 * keyboard shortcuts, and disabling JS all bypass it. Document-viewing routes
 * layer the stronger ScreenGuard protections (copy/print/screenshot deterrents)
 * on top of this.
 */
export function DisableContextMenu() {
  useEffect(() => {
    const block = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', block);
    return () => document.removeEventListener('contextmenu', block);
  }, []);
  return null;
}
