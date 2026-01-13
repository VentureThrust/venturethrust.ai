'use client';

import { FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SavedReportsPage() {
  const savedReports: any[] = [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Saved Reports</h1>
        <p className="text-muted-foreground mt-1">
          Access and manage all your generated due diligence reports.
        </p>
      </div>

      {savedReports.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card/50 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-6 text-xl font-semibold">No Saved Reports</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You haven&apos;t saved any reports yet. Reports you save from the due diligence page will appear here.
          </p>
          <Button variant="outline" className="mt-6">
            <Search className="mr-2 h-4 w-4" /> Run a New Analysis
          </Button>
        </div>
      ) : (
        <div>
          {/* Table of saved reports will go here */}
        </div>
      )}
    </div>
  );
}
