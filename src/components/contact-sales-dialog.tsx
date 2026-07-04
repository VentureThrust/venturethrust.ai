'use client';

/**
 * Contact-sales popup. Reuses the contact form (locked to the "sales" topic, so
 * submissions are emailed to the sales inbox) inside a dialog. Use
 * <ContactSalesDialog> when you already manage open state, or
 * <ContactSalesButton> for a self-contained trigger + dialog.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ContactForm } from './contact-form';

export function ContactSalesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Talk to sales</DialogTitle>
          <DialogDescription>
            Tell us what you need: an investor setup, more storage, more seats, SSO, or a custom
            plan. Replies usually arrive within 5 minutes, and never later than 6 hours.
          </DialogDescription>
        </DialogHeader>
        <ContactForm defaultTopic="sales" hideTopic />
      </DialogContent>
    </Dialog>
  );
}

export function ContactSalesButton({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} style={style}>
        {children ?? 'Contact sales'}
      </button>
      <ContactSalesDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
