import { Pen, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, isPen = false }: { className?: string, isPen?: boolean }) {
  const Icon = isPen ? Pen : ShieldCheck;
  return (
    <Link href="/" className={cn("flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1 -m-1", className)}>
      <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
      <span className="text-xl font-semibold text-foreground">
        VentureTrust.
      </span>
       {isPen && <span className="text-xl font-bold text-primary">PEN</span>}
    </Link>
  );
}
