'use client';

/**
 * <UserNav> - header user pill (username + initial avatar + chevron).
 *
 * Drop-in for every authenticated layout. Renders the same visual treatment
 * as the dashboard so the header reads consistently across:
 *   - /dashboard
 *   - /(app)/* (content library, spaces, agreements, file requests, analytics)
 *   - /(app)/spaces/[id]/edit/* (data-room editor)
 *
 * Previously this rendered only a generic avatar with hardcoded "John Doe" -
 * now it pulls the real user from useUser() so what visitors see matches the
 * signed-in account.
 */

import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { supabase } from '@/lib/supabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
      width="18"
      height="18"
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

export function UserNav() {
  const { user, loading } = useUser();

  // Don't render anything until auth resolves (avoids flashing the wrong
  // initial / placeholder name). Header gets a brief gap which is fine.
  if (loading || !user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-3 px-2 py-1 rounded-md outline-none cursor-pointer hover:bg-gray-50 transition-colors"
          aria-label="Open account menu"
        >
          <span className="hidden sm:inline font-medium text-sm">
            {user.firstName}
          </span>
          <UserAvatar name={user.firstName} />
          <ChevronDown />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none truncate">
              {user.firstName}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
