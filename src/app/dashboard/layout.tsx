'use client';

import { usePathname } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { UserProvider } from '@/hooks/use-user';
import { cn } from '@/lib/utils';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDueDiligencePage = pathname.startsWith('/dashboard/due-diligence');

  return (
    <UserProvider>
      <div className={cn("flex h-screen w-full bg-background", isDueDiligencePage && "flex-col")}>
        {!isDueDiligencePage && (
          <div className="hidden lg:block w-72 flex-shrink-0">
            <DashboardSidebar />
          </div>
        )}
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader />
          <main className={cn(
            "flex-1 overflow-y-auto",
            !isDueDiligencePage && "p-6 lg:p-8"
          )}>
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
