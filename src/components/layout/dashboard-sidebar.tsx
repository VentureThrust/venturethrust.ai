'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Home,
  Folder,
  Cpu,
  Bookmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

const mainNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/data-rooms', label: 'Data Rooms', icon: Folder },
  { href: '/dashboard/ai-risk-scanner', label: 'AI Risk Scanner', icon: Cpu },
  { href: '/dashboard/saved-reports', label: 'Saved Reports', icon: Bookmark },
  { href: '/dashboard/shared-with-me', label: 'Shared With Me', icon: Users },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  const isDueDiligencePage = pathname.startsWith('/dashboard/due-diligence');

  if (isDueDiligencePage) {
    return null;
  }

  return (
    <div className="flex h-full flex-col border-r bg-card text-card-foreground w-60">
      <div className="flex h-20 items-center border-b px-6">
        <Logo isPen={true} />
      </div>
      <div className="flex-1 overflow-auto py-3">
        <nav className="flex flex-col">
          {mainNavLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-6 py-3 text-base text-muted-foreground transition-all hover:bg-muted hover:text-foreground w-full',
                pathname === href ? 'bg-muted text-foreground font-medium' : ''
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
