'use client';

/**
 * UpgradeDialog - the friendly prompt shown when a plan limit is hit (members,
 * storage, spaces). Explains the limit and routes to Billing, instead of a
 * destructive error toast.
 */

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

export function UpgradeDialog({
  open,
  onOpenChange,
  title = 'Time to upgrade',
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
}) {
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-1 grid h-14 w-14 place-items-center rounded-full bg-[#F0F5FF]">
            <Rocket className="h-7 w-7 text-[#4285F4]" />
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center text-base">
            {description} Upgrade your plan to keep going.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-2">
          <Button
            className="w-full bg-[#4285F4] text-white hover:bg-[#3367d6]"
            onClick={() => {
              onOpenChange(false);
              router.push('/dashboard/billing');
            }}
          >
            See upgrade options
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
