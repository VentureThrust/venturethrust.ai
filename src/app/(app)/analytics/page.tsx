
'use client';

import { viewers } from '@/lib/data';
import { AnalyticsView } from './[documentId]/_components/analytics-view';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { format } from 'date-fns';
import { getDocumentIcon } from '@/lib/data';
import { useFolders } from '@/lib/folder-provider';
import { BarChart2 } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { AnalyticsIllustration } from '@/components/illustrations';
import { ProductTour } from '@/components/product-tour';

export default function AnalyticsPage() {
  const { documents } = useFolders();
  return (
    <div className="flex flex-col gap-6">
      <ProductTour
        tourKey="tour-analytics"
        steps={[
          {
            title: 'See what investors actually read',
            description: 'Engagement analytics for everything you share: who opened it, which pages held attention, and for how long.',
          },
          {
            selector: '[data-tour="analytics-doc"]',
            title: 'Open any document',
            description: 'Click a document to see each viewer, the time spent on every page, and live view tracking.',
          },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Document Analytics
        </h1>
        <p className="text-muted-foreground">
          Engagement insights for your documents.
        </p>
      </div>

      {documents.length > 0 ? (
        <Accordion type="single" collapsible className="w-full space-y-2">
          {documents.map((doc) => {
            const Icon = getDocumentIcon(doc.type);
            return (
              <AccordionItem
                value={doc.id}
                key={doc.id}
                data-tour="analytics-doc"
                className="border rounded-lg"
              >
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex items-center gap-4 text-left">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium">{doc.name}</span>
                      <span className="text-sm text-muted-foreground">
                        Created on{' '}
                        {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <AnalyticsView documentName={doc.name} viewers={viewers} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="rounded-lg border-2 border-dashed">
          <EmptyState
            illustration={<AnalyticsIllustration />}
            title="No analytics yet"
            description="Share a document or data room and you'll see who viewed it, which pages held attention, and for how long - all right here."
            action={{ label: 'Open a data room', href: '/spaces' }}
          />
        </div>
      )}
    </div>
  );
}
