'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Home,
  Folder,
  Package,
  FileLock,
  FileUp,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

// One consistent, DocSend-style nav shared across the app.
const mainNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, exact: true },
  { href: '/content-library', label: 'Content library', icon: Folder },
  { href: '/spaces', label: 'Spaces', icon: Package },
  { href: '/agreements', label: 'Agreements', icon: FileLock },
  { href: '/file-requests', label: 'File requests', icon: FileUp },
  { href: '/dashboard/shared-with-me', label: 'Shared with me', icon: Users },
];

const footerNavLinks = [
  { href: '/settings', label: 'Settings', icon: Settings, exact: false },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  const isDueDiligencePage = pathname.startsWith('/dashboard/due-diligence');
  if (isDueDiligencePage) {
    return null;
  }

  const linkClass = (href: string, exact?: boolean) =>
    cn(
      'flex items-center gap-3 px-6 py-3 text-base text-muted-foreground transition-all hover:bg-muted hover:text-foreground w-full',
      (exact ? pathname === href : pathname.startsWith(href)) ? 'bg-muted text-foreground font-medium' : ''
    );

  return (
    <div className="flex h-full flex-col border-r bg-card text-card-foreground w-60">
      <div className="flex h-20 items-center border-b px-6">
        <Logo isPen={true} />
      </div>
      <div className="flex-1 overflow-auto py-3">
        <nav className="flex flex-col">
          {mainNavLinks.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} className={linkClass(href, exact)}>
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t py-3">
        <nav className="flex flex-col">
          {footerNavLinks.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} className={linkClass(href, exact)}>
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
