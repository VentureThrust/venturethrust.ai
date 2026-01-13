'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Users,
  Share2,
  BarChart2,
  Home,
  Folder,
  Cpu,
  Bookmark,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

const mainNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/data-rooms', label: 'Data Rooms', icon: Folder },
  { href: '/dashboard/ai-risk-scanner', label: 'AI Risk Scanner', icon: Cpu },
  { href: '/dashboard/saved-reports', label: 'Saved Reports', icon: Bookmark },
  { href: '/dashboard/shared-with-me', label: 'Shared With Me', icon: Settings },
];

const quickActionsLinks = [
  { href: '/dashboard/invite-investors', label: 'Invite Investors', icon: Users },
  { href: '/dashboard/share-data-room', label: 'Share Data Room', icon: Share2 },
  { href: '/dashboard/view-analytics', label: 'View Analytics', icon: BarChart2 },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  const isDueDiligencePage = pathname.startsWith('/dashboard/due-diligence');

  if (isDueDiligencePage) {
    return null;
  }

  return (
    <div className="flex h-full flex-col border-r bg-card text-card-foreground">
        <div className="flex h-20 items-center border-b px-6">
           <Logo isPen={true} />
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            {mainNavLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary',
                  pathname === href ? 'bg-primary/10 text-primary font-semibold' : ''
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}

            <div className="px-3 py-2 mt-4">
                <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                    <AccordionItem value="item-1" className="border-b-0">
                        <AccordionTrigger suppressHydrationWarning className="p-1 text-muted-foreground hover:no-underline font-semibold [&[data-state=open]>svg]:text-foreground [&>svg]:ml-auto [&[data-state=open]]:text-foreground">
                         <div className='flex items-center gap-3'>
                            <Users className="h-5 w-5" /> Quick actions
                         </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-0 pl-4 pt-2 space-y-1">
                        {quickActionsLinks.map(({ href, label, icon: Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
                              pathname === href ? 'bg-muted text-foreground' : ''
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {label}
                          </Link>
                        ))}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
          </nav>
        </div>
    </div>
  );
}
