'use client';

// The dashboard now uses the SAME shell as the rest of the app (/spaces,
// /content-library, /agreements, …) so the sidebar + header are identical
// everywhere and never swap when you navigate between them.

import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { AppSidebarContent } from '@/components/app-sidebar-content';
import { LayoutProvider, useLayout } from '@/app/(app)/layout-context';
import { SpacesProvider } from '@/lib/spaces-provider';
import { FileRequestProvider } from '@/lib/file-requests-provider';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AlertsProvider } from '@/lib/alerts-provider';
import { UserProvider } from '@/hooks/use-user';
import { PlanGate } from '@/components/plan-gate';
import { AuthSyncGuard } from '@/components/auth-sync-guard';
import { NavigationLoader } from '@/components/NavigationLoader';
import { ModalLockWatchdog } from '@/components/modal-lock-watchdog';
import { NotificationBell } from '@/components/notification-bell';
import { WelcomeBackPopup } from '@/components/welcome-back-popup';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { GlobalSearch } from '@/components/global-search';
import { cn } from '@/lib/utils';

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { fileRequestCount } = useLayout();
  const pathname = usePathname();

  const isDueDiligencePage = pathname.startsWith('/dashboard/due-diligence');
  const isDashboardHome = pathname === '/dashboard';

  // The AI report viewer renders full-screen with no chrome.
  if (isDueDiligencePage) {
    return <div className="h-screen w-full bg-white">{children}</div>;
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar>
        <AppSidebarContent fileRequestCount={fileRequestCount} />
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex flex-1 justify-center">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-2">
            <WorkspaceSwitcher />
            <NotificationBell />
            <UserNav />
          </div>
        </header>
        <main className={cn('flex-1 overflow-y-auto', isDashboardHome ? 'p-0' : 'p-4 sm:p-6')}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <AuthSyncGuard />
      <PlanGate>
        <AlertsProvider>
          <LayoutProvider>
            <SpacesProvider>
              <FileRequestProvider>
                <SidebarProvider>
                  <NavigationLoader />
                  <ModalLockWatchdog />
                  <WelcomeBackPopup />
                  <DashboardInner>{children}</DashboardInner>
                </SidebarProvider>
              </FileRequestProvider>
            </SpacesProvider>
          </LayoutProvider>
        </AlertsProvider>
      </PlanGate>
    </UserProvider>
  );
}
