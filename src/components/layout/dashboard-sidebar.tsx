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
    UserCheck,
    UploadCloud
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { Button } from '../ui/button';

const mainNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/data-rooms', label: 'Data Rooms', icon: Folder },
  { href: '/ai-diligence', label: 'AI Due Diligence', icon: Cpu },
  { href: '/shared-with-me', label: 'Shared With Me', icon: UserCheck },
];

const quickActionsLinks = [
  { href: '/invite-investors', label: 'Invite Investors', icon: Users },
  { href: '/share-data-room', label: 'Share Data Room', icon: Share2 },
  { href: '/view-analytics', label: 'View Analytics', icon: BarChart2 },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col border-r w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground">
      <div className="flex h-full flex-col">
        <div className="flex h-20 items-center border-b px-6 flex-shrink-0">
           <Logo isPen={true} />
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            {mainNavLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-sidebar-active-background/10 hover:text-primary',
                  pathname === href ? 'bg-blue-100 text-primary font-semibold' : ''
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}

            <div className="px-3 py-2 mt-4">
                <Accordion type="single" collapsible defaultValue="item-1">
                    <AccordionItem value="item-1" className="border-b-0">
                        <AccordionTrigger suppressHydrationWarning className="p-1 text-muted-foreground hover:no-underline font-semibold [&[data-state=open]>svg]:text-foreground [&>svg]:ml-auto">
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
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground',
                              pathname === href ? 'bg-muted text-foreground' : ''
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            {label}
                          </Link>
                        ))}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
            <Button variant="outline" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <UploadCloud className="mr-2 h-4 w-4" />
                Upgrade Plan
            </Button>
        </div>
      </div>
    </div>
  );
}
