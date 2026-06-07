'use client';

/**
 * AI Risk Scanner - gated as an "Upcoming" feature.
 *
 * The full scanner (upload → AI diligence → saved reports) is parked while we
 * run a closed pilot. This page intentionally makes NO calls to the AI backend
 * (that's what used to throw "Failed to fetch" when the backend was off). It
 * simply shows a "Coming soon" screen + the pilot waitlist. The original
 * implementation lives in git history and can be restored when we re-enable AI.
 */

import { useState } from 'react';
import { Sparkles, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UpcomingFeatureDialog } from '@/components/upcoming-feature-dialog';

export default function AiRiskScannerPage() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="max-w-lg">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 border border-blue-200 mb-5">
          <Rocket className="h-3.5 w-3.5" /> Coming soon
        </span>

        <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-white" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-3">AI Risk Scanner is coming soon</h1>

        <p className="text-muted-foreground leading-relaxed mb-7">
          Our AI due-diligence engine is in a closed pilot. We&apos;re validating accuracy with a
          small group of professional investors and analysts before opening it up - so every report
          you generate is one you can trust. Join the pilot waitlist to get early access.
        </p>

        <Button
          size="lg"
          className="bg-gray-900 hover:bg-gray-800 text-white"
          onClick={() => setWaitlistOpen(true)}
        >
          <Sparkles className="h-4 w-4 mr-2" /> Join the pilot waitlist
        </Button>
      </div>

      <UpcomingFeatureDialog
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        featureName="AI Risk Scanner"
      />
    </div>
  );
}
