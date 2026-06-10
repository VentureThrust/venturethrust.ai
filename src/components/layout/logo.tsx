import { Pen, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, isPen = false }: { className?: string, isPen?: boolean }) {
  const Icon = isPen ? Pen : ShieldCheck;
  return (
    <Link href="/" className={cn("flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1 -m-1", className)}>
       <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#F0F5FF"/>
        <path d="M9 14.1288V24H12.3789V17.525C12.3789 16.8921 12.6186 16.2843 13.0488 15.8225C13.4791 15.3607 14.0719 15.1016 14.6953 15.1016C15.3187 15.1016 15.9115 15.3607 16.3418 15.8225C16.772 16.2843 17.0117 16.8921 17.0117 17.525V24H20.3906V14.1288C20.3906 12.8021 19.9242 11.5303 19.0833 10.627C18.2425 9.72373 17.0938 9.22266 15.8789 9.22266C14.664 9.22266 13.5153 9.72373 12.6745 10.627L12.5 10.8125L12.3255 10.627C11.4847 9.72373 10.336 9.22266 9.12109 9.22266C7.90615 9.22266 6.75752 9.72373 5.91665 10.627C5.07578 11.5303 4.60938 12.8021 4.60938 14.1288V24H8V14.1288C8 13.7997 8.12515 13.4842 8.35366 13.2378C8.58217 12.9914 8.89332 12.8555 9.22266 12.8555C9.552 12.8555 9.86314 12.9914 10.0917 13.2378C10.3202 13.4842 10.4453 13.7997 10.4453 14.1288V24H11V14.1288L9 14.1288Z" fill="#4285F4"/>
        <path d="M26.4999 9H22.9999L18.4999 16.25L22.9999 23.5H26.4999L21.9999 16.25L26.4999 9Z" fill="#FBBC05"/>
       </svg>
      <span className="text-xl font-semibold text-foreground">
        VentureThrust.
      </span>
       {isPen && <span className="text-xl font-bold text-primary">ai</span>}
    </Link>
  );
}
