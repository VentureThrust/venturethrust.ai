// SAVE TO: src/app/spaces/[spaceId]/view/layout.tsx

import { Toaster } from '@/components/ui/toaster';

export default function SpaceViewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}