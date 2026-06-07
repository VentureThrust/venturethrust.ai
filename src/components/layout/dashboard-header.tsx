'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Mail } from 'lucide-react';
import { NotificationBell } from '@/components/notification-bell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { DashboardSidebar } from './dashboard-sidebar';
import { useUser } from '@/hooks/use-user';
import { Logo } from './logo';
import { supabase } from '@/lib/supabaseClient';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/data-rooms': 'Data Rooms',
  '/dashboard/ai-risk-scanner': 'AI Risk Scanner',
  '/dashboard/saved-reports': 'Saved Reports',
  '/dashboard/shared-with-me': 'Shared With Me',
  '/dashboard/profile': 'Profile',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.keys(PAGE_TITLES)
    .filter((key) => pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match] : 'Dashboard';
}

function UserAvatar({ name }: { name: string }) {
  const initial = name?.[0]?.toUpperCase() ?? '?';
  return (
    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm select-none flex-shrink-0">
      {initial}
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserDropdown({
  firstName,
  avatarFirst = false,
}: {
  firstName: string;
  avatarFirst?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-2 py-1 rounded-md outline-none cursor-pointer hover:bg-transparent focus:bg-transparent">
          {avatarFirst ? (
            <>
              <UserAvatar name={firstName} />
              <span className="hidden sm:inline font-medium text-sm">
                {firstName}
              </span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline font-medium text-sm">
                {firstName}
              </span>
              <UserAvatar name={firstName} />
            </>
          )}
          <ChevronDown />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardHeader() {
  const { user, loading } = useUser();
  const pathname = usePathname();

  const isDueDiligencePage = pathname.startsWith('/dashboard/due-diligence');
  const pageTitle = getPageTitle(pathname);

  if (loading || !user) {
    return (
      <header className="flex h-20 items-center border-b border-[#ebebeb] bg-white px-6 lg:px-8" />
    );
  }

  if (isDueDiligencePage) {
    return (
      <header className="flex h-20 items-center justify-between gap-4 border-b border-[#ebebeb] bg-white px-6 lg:px-8 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" suppressHydrationWarning>
            <Menu className="h-5 w-5" />
          </Button>
          <Logo isPen={true} />
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            suppressHydrationWarning
          >
            <Mail className="h-5 w-5" />
            <span className="sr-only">Messages</span>
          </Button>

          <UserDropdown firstName={user.firstName} avatarFirst />
        </div>
      </header>
    );
  }

  return (
    <header className="flex h-20 items-center justify-between gap-4 border-b border-[#ebebeb] bg-white px-6 lg:px-8 flex-shrink-0">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="lg:hidden w-64 p-0">
            <SheetHeader>
              <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
            </SheetHeader>
            <DashboardSidebar />
          </SheetContent>
        </Sheet>

        <h1 className="text-2xl font-semibold hidden lg:block">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />

        <UserDropdown firstName={user.firstName} />
      </div>
    </header>
  );
}