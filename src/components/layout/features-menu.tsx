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
import { FEATURE_GROUPS } from '@/lib/features';

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
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Click toggles the mega menu; hovering also opens it. */}
      <button
        type="button"
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
        // Outer wrapper sits flush under the label with transparent top padding,
        // so moving the cursor onto the menu never crosses an un-hovered gap.
        <div className="absolute left-0 top-full z-50 w-[960px] max-w-[calc(100vw-2rem)] pt-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
            <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
              {FEATURE_GROUPS.map((group) => (
                <div key={group.heading}>
                  <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {group.heading}
                  </p>
                  {group.items.map((f) => (
                    <Link
                      key={f.title}
                      href={f.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-2.5 rounded-lg p-2 transition-colors hover:bg-gray-50"
                    >
                      <span
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#F0F5FF]"
                        style={{ color: BLUE }}
                      >
                        <f.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-gray-900">{f.title}</span>
                        <span className="block text-[11px] text-gray-500">{f.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
