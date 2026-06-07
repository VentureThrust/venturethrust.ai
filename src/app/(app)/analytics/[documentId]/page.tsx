
'use client';

import { viewers } from '@/lib/data';
import { AnalyticsView } from './_components/analytics-view';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { format } from 'date-fns';
import { getDocumentIcon } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { useFolders } from '@/lib/folder-provider';
import React from 'react';

export default function AnalyticsPage() {
  const params = useParams();
  const documentId = params.documentId as string;

  const { findDocument } = useFolders();
  const document = findDocument(documentId);

  if (!document) {
    notFound();
  }

  const Icon = getDocumentIcon(document.type);

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

      <Accordion
        type="single"
        collapsible
        defaultValue={document.id}
        className="w-full space-y-2"
      >
        <AccordionItem value={document.id} className="border rounded-lg">
          <AccordionTrigger className="p-4 hover:no-underline">
            <div className="flex items-center gap-4 text-left">
              <Icon className="h-6 w-6 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium">{document.name}</span>
                <span className="text-sm text-muted-foreground">
                  Created on{' '}
                  {format(new Date(document.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <AnalyticsView documentName={document.name} viewers={viewers} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
