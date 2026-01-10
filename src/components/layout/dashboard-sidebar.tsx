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
  ArrowUpRight,
  Save,
  Scan,
  Settings,
  Share2,
  Users,
  Briefcase,
  LayoutDashboard,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Logo } from './logo';

const mainNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/data-rooms', label: 'Data Rooms', icon: Briefcase },
  { href: '/ai-risk-scanner', label: 'AI Risk Scanner', icon: Scan },
  { href: '/saved-reports', label: 'Saved Reports', icon: Save },
  { href: '/shared-with-me', label: 'Shared With Me', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const quickActionsLinks = [
  { href: '/invite-investors', label: 'Invite Investors', icon: Users },
  { href: '/share-data-room', label: 'Share Data Room', icon: Share2 },
  { href: '/view-analytics', label: 'View Analytics', icon: ArrowUpRight },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex flex-col border-r w-64 flex-shrink-0 bg-card text-card-foreground">
      <div className="flex h-full max-h-screen flex-col">
        <div className="flex h-16 items-center border-b px-6">
           <Logo isPen={true} />
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            {mainNavLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground',
                  pathname === href ? 'bg-muted/50 text-foreground font-semibold' : ''
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}

            <div className="px-3 py-2 mt-4">
                <Accordion type="single" collapsible defaultValue="item-1">
                    <AccordionItem value="item-1" className="border-b-0">
                        <AccordionTrigger className="py-1 text-muted-foreground hover:no-underline font-semibold [&[data-state=open]>svg]:text-foreground">
                         <div className='flex items-center gap-3'>
                            <Users className="h-4 w-4" /> Quick actions
                         </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-0 pl-7 pt-2 space-y-1">
                        {quickActionsLinks.map(({ href, label, icon: Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground',
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
    </div>
  );
}
