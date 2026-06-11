import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Brand logo: a solid brand-blue VT monogram tile + the VentureThrust
 * wordmark. `isPen` appends the .ai suffix (used inside the app shell).
 */
export function Logo({ className, isPen = false }: { className?: string; isPen?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center gap-2.5 rounded-md p-1 -m-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <span
        aria-hidden
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[#4285F4] text-[12px] font-extrabold leading-none tracking-tight text-white shadow-sm"
      >
        VT
      </span>
      <span className="text-xl font-bold tracking-tight text-foreground">
        VentureThrust{isPen && <span className="text-[#4285F4]">.ai</span>}
      </span>
    </Link>
  );
}
