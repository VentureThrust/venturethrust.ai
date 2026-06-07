'use client';

/**
 * <Reveal> - scroll-triggered fade-and-rise animation wrapper.
 *
 * Uses IntersectionObserver so the animation only fires when the element
 * enters the viewport. After it fires once, the observer stops watching
 * (no replay on re-scroll - feels professional, not gimmicky).
 *
 * Usage:
 *   <Reveal><h2>Section heading</h2></Reveal>
 *   <Reveal delayMs={150}><FeatureCard /></Reveal>
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Delay before the animation starts (ms). Useful for staggering siblings. */
  delayMs?: number;
  /** Translate-from direction. 'up' is the standard reveal. */
  from?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Custom className passed through to the wrapper. */
  className?: string;
  /** Re-trigger every time element re-enters. Default false (one-shot). */
  once?: boolean;
}

export function Reveal({
  children,
  delayMs = 0,
  from = 'up',
  className = '',
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const translate = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8',
    none: '',
  }[from];

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${translate}`
      } ${className}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
