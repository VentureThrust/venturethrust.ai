import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Brand logo: the angular VT monogram (a sharp V with a long top bar beside a
 * slanted, parallel T) + the VentureThrust wordmark. Drawn as inline SVG with
 * fill=currentColor so it stays crisp at any size and inherits text color.
 *
 * The brand is "VentureThrust" - no .ai suffix. `isPen` is kept only so older
 * call sites keep compiling; it no longer changes the render.
 */

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 146 124"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      {/* V */}
      <path d="M6 12 L26 12 L52 72 L78 12 L98 12 L52 112 Z" />
      {/* long top bar on the V's left arm */}
      <path d="M6 12 L56 12 L49 25 L12 25 Z" />
      {/* slanted T: top bar */}
      <path d="M102 12 L142 12 L135 25 L95 25 Z" />
      {/* slanted T: stem, parallel to the V, ending below it */}
      <path d="M102 25 L122 25 L82 120 L68 107 Z" />
    </svg>
  );
}

export function Logo({
  className,
  isPen: _isPen = false,
}: {
  className?: string;
  isPen?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center gap-2.5 rounded-md p-1 -m-1 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <LogoMark className="h-7 w-auto shrink-0" />
      <span className="text-xl font-bold tracking-tight">VentureThrust</span>
    </Link>
  );
}
