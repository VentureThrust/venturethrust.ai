
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

export default function AnalyticsPage() {
  const { documents } = useFolders();
  return (
    <div className="flex flex-col gap-6">
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
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed h-96 gap-4 text-muted-foreground">
          <BarChart2 className="h-16 w-16" />
          <h2 className="text-xl font-semibold">No Analytics Data</h2>
          <p>Upload a document and share it to see engagement insights.</p>
        </div>
      )}
    </div>
  );
}
