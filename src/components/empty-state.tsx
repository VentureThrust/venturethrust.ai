'use client';

/**
 * EmptyState - a friendly, colorful empty screen: illustration + headline +
 * subtext + an optional call-to-action. Drop it in wherever a list/page has
 * no content yet, passing one of the illustrations from `@/components/illustrations`.
 */
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  illustration: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  secondaryAction?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}

export function EmptyState({
  illustration,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const renderAction = (a: NonNullable<EmptyStateProps['action']>, primary: boolean) => {
    const variant = primary ? 'default' : 'outline';
    if (a.href) {
      return (
        <Button asChild variant={variant} className={primary ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''}>
          <a href={a.href}>{a.label}</a>
        </Button>
      );
    }
    return (
      <Button variant={variant} onClick={a.onClick} className={primary ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''}>
        {a.label}
      </Button>
    );
  };

  return (
    <div className={cn('flex w-full flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="w-52 max-w-[70%]">{illustration}</div>
      <h3 className="mt-6 text-xl font-semibold tracking-tight text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action && renderAction(action, true)}
          {secondaryAction && renderAction(secondaryAction, false)}
        </div>
      )}
    </div>
  );
}
