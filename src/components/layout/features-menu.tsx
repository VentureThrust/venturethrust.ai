'use client';

/**
 * FeaturesMenu - the "Features" nav item with a DocSend-style mega menu.
 * Click to open a panel listing every feature, grouped with icons and short
 * descriptions, each scrolling to the relevant landing section.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FEATURES } from '@/lib/features';

const BLUE = '#4285F4';

export function FeaturesMenu() {
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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1 text-sm font-medium transition-colors',
          open ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Features
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-3 w-[640px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#F0F5FF]" style={{ color: BLUE }}>
                  <f.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{f.title}</span>
                  <span className="block text-xs text-gray-500">{f.desc}</span>
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5">
            <span className="text-xs text-gray-500">Everything you need to run a secure raise.</span>
            <Link
              href="/features"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold"
              style={{ color: BLUE }}
            >
              See all features →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
