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
import { Search, Monitor } from 'lucide-react';
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

// The data-room and agreement editors are desktop tools (folder tree, drag-drop,
// PDF field placement). On phones we show a tidy notice instead of a cramped,
// broken layout. Editing stays fully available on tablet/desktop.
function DesktopOnlyNotice({
  backHref = '/spaces',
  backLabel = 'Back to spaces',
}: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-muted/40 px-6 text-center md:hidden">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F0F5FF] text-[#4285F4]">
        <Monitor className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900">Best edited on a larger screen</h1>
      <p className="max-w-xs text-sm text-gray-600">
        Building and managing a data room works best on a laptop or desktop. Open this page there to
        edit. Sharing and viewing work great on mobile.
      </p>
      <a
        href={backHref}
        className="inline-flex h-11 items-center rounded-lg bg-[#4285F4] px-5 text-sm font-semibold text-white"
      >
        {backLabel}
      </a>
    </div>
  );
}

const SpaceEditLayout = ({ children }: { children: React.ReactNode }) => {
  const { fileRequestCount } = useLayout();

  return (
    <>
      <DesktopOnlyNotice />
      <div className="hidden h-screen w-full bg-muted/40 md:flex">
        <Sidebar>
          <AppSidebarContent fileRequestCount={fileRequestCount} isSpaceView />
        </Sidebar>
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
};

const AgreementEditLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <DesktopOnlyNotice backHref="/agreements" backLabel="Back to agreements" />
      <div className="hidden h-screen w-full bg-muted/40 md:block">{children}</div>
    </>
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