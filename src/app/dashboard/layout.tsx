'use client';

import { usePathname } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { UserProvider } from '@/hooks/use-user';
import { AlertsProvider } from '@/lib/alerts-provider';
import { WelcomeBackPopup } from '@/components/welcome-back-popup';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDueDiligencePage = pathname.startsWith('/dashboard/due-diligence');
  const isDashboard = pathname === '/dashboard';

  return (
    <UserProvider>
      <AlertsProvider>
        <WelcomeBackPopup />
        <div className={cn("flex h-screen w-full bg-white", isDueDiligencePage && "flex-col")}>
          {!isDueDiligencePage && (
            <div className="hidden lg:block w-60 flex-shrink-0">
              <DashboardSidebar />
            </div>
          )}
          <div className="flex flex-1 flex-col overflow-hidden bg-white">
            <DashboardHeader />
            <main className={cn(
              "flex-1 overflow-y-auto bg-white",
              !isDueDiligencePage && !isDashboard && "p-6 lg:p-8",
              isDashboard && "p-0"
            )}>
              {children}
            </main>
          </div>
        </div>
      </AlertsProvider>
    </UserProvider>
  );
}