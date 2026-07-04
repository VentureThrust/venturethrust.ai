'use client';

/**
 * InvestorWelcome - one-time welcome popup for freshly activated investors.
 *
 * Shows on the dashboard the first time an is_investor account loads it:
 * a welcome, their assigned account manager (name, email, phone), and a
 * walkthrough. If NEXT_PUBLIC_INVESTOR_TOUR_VIDEO_URL is set, the actual
 * screen-recording video plays inline; otherwise an illustrated three-step
 * guide shows. Dismissal is remembered per browser.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { DW_MANAGER_INFO, INVESTOR_TOUR_VIDEO_URL } from '@/lib/deal-watch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, UserCheck, BellRing, Mail, Phone, ArrowRight } from 'lucide-react';

const SEEN_KEY = 'vt_investor_welcome_seen';

const STEPS = [
  {
    icon: Star,
    title: 'Add startups to your watchlist',
    desc: 'Open any deck or data room shared with you and click Add to Watchlist. The founder never sees it.',
  },
  {
    icon: UserCheck,
    title: 'Assign them to your account manager',
    desc: 'One click and a real person follows every update that founder makes, so you never have to.',
  },
  {
    icon: BellRing,
    title: 'Hear only what matters',
    desc: 'No feeds, no noise. You get one message when a watched startup makes real progress.',
  },
];

export function InvestorWelcome() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (localStorage.getItem(SEEN_KEY)) return;
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) return;
        const { data } = await supabase
          .from('profiles')
          .select('is_investor')
          .eq('id', uid)
          .maybeSingle();
        if (active && (data as { is_investor?: boolean } | null)?.is_investor === true) {
          setOpen(true);
        }
      } catch { /* stay closed */ }
    })();
    return () => { active = false; };
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode */ }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Welcome to Deal Watch
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Your investor account is active. From now on, every startup you have seen can stay on
          your radar without any work from you.
        </p>

        {/* Assigned account manager */}
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#4285F4] text-lg font-semibold text-white">
            {DW_MANAGER_INFO.name[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{DW_MANAGER_INFO.name}</p>
            <p className="text-xs text-muted-foreground">Your account manager</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3 text-[#4285F4]" />{DW_MANAGER_INFO.email}
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3 text-[#4285F4]" />{DW_MANAGER_INFO.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Walkthrough: real video when configured, illustrated steps until then */}
        {INVESTOR_TOUR_VIDEO_URL ? (
          <video
            src={INVESTOR_TOUR_VIDEO_URL}
            controls
            playsInline
            className="w-full rounded-xl border border-gray-200 bg-black"
          />
        ) : (
          <div className="space-y-3">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-200 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#F0F5FF] text-[#4285F4]">
                  <s.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={dismiss}>
            I will explore myself
          </Button>
          <Button
            onClick={() => {
              dismiss();
              router.push('/dashboard/shared-with-me');
            }}
          >
            See decks shared with me
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
