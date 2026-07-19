'use client';

/**
 * SolutionsMenu - the "Who it's for" nav item. Two audiences:
 *   For investors -> /investors  (the Deal Watch landing page)
 *   For startups  -> /           (the data room story on the home page)
 * Same open/close behavior as FeaturesMenu.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Radar, FolderLock } from 'lucide-react';
import { cn } from '@/lib/utils';

const BLUE = '#4285F4';

const ITEMS = [
  {
    href: '/investors',
    icon: Radar,
    title: 'For investors',
    desc: 'Deal Watch: never miss the next big startup',
  },
  {
    href: '/',
    icon: FolderLock,
    title: 'For startups',
    desc: 'Data rooms, deck analytics, e-signatures',
  },
];

export function SolutionsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1 text-sm font-medium transition-colors',
          open ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Who it&apos;s for
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 w-80 pt-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
            {ITEMS.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#F0F5FF]"
                  style={{ color: BLUE }}
                >
                  <it.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{it.title}</span>
                  <span className="block text-xs text-gray-500">{it.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
