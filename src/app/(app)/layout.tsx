'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { AppSidebarContent } from '@/components/app-sidebar-content';
import { LayoutProvider, useLayout } from './layout-context';
import { SpacesProvider } from '@/lib/spaces-provider';
import { FileRequestProvider } from '@/lib/file-requests-provider';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { AlertsProvider } from '@/lib/alerts-provider';
import { UserProvider } from '@/hooks/use-user';
import { PlanGate } from '@/components/plan-gate';
import { AuthSyncGuard } from '@/components/auth-sync-guard';
import { NavigationLoader } from '@/components/NavigationLoader';
import { ModalLockWatchdog } from '@/components/modal-lock-watchdog';
import { NotificationBell } from '@/components/notification-bell';
import { WelcomeBackPopup } from '@/components/welcome-back-popup';
import { SharedWithYouPopup } from '@/components/shared-with-you-popup';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { GlobalSearch } from '@/components/global-search';

const StandardLayout = ({ children }: { children: React.ReactNode }) => {
  const { fileRequestCount } = useLayout();

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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// The space and agreement editors are fully available on every screen size
// (DocSend-style). On phones the space editor gets a slim top bar with the
// sidebar drawer trigger so navigation is always reachable.
const SpaceEditLayout = ({ children }: { children: React.ReactNode }) => {
  const { fileRequestCount } = useLayout();

  return (
    <div className="flex h-screen w-full bg-muted/40">
      <Sidebar>
        <AppSidebarContent fileRequestCount={fileRequestCount} isSpaceView />
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile-only bar: the drawer trigger, since the editor has no header */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-white px-3 md:hidden">
          <SidebarTrigger />
          <span className="text-sm font-medium text-gray-700">Space editor</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const AgreementEditLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen w-full overflow-y-auto bg-muted/40">{children}</div>
  );
};

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isSpaceEdit = pathname.includes('/spaces/') && pathname.includes('/edit');
  const isAgreementEdit = pathname.includes('/agreements/edit');

  return (
    <>
      <NavigationLoader />
      <ModalLockWatchdog />
      <WelcomeBackPopup />
      <SharedWithYouPopup />
      {isAgreementEdit ? (
        <AgreementEditLayout>{children}</AgreementEditLayout>
      ) : isSpaceEdit ? (
        <SpaceEditLayout>{children}</SpaceEditLayout>
      ) : (
        <StandardLayout>{children}</StandardLayout>
      )}
    </>
  );
}

export default function AppLayout({
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
                  <AppLayoutContent>{children}</AppLayoutContent>
                </SidebarProvider>
              </FileRequestProvider>
            </SpacesProvider>
          </LayoutProvider>
        </AlertsProvider>
      </PlanGate>
    </UserProvider>
  );
}