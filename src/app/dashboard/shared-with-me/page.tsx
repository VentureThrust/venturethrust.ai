'use client';

/**
 * Shared with me - full-width professional layout, no cards.
 *
 * Three tabs:
 *   • Shared with me : items shared with this user that they have NOT opened yet
 *   • Opened         : items they have opened
 *   • Watchlist      : startups they follow (dw_watchlist)
 *
 * Space/file data comes from the service-role route /api/shared-with-me
 * (RLS blocks reading other owners' rows from the browser). Opening always
 * goes through /shared/{token} when a token exists so every gate applies;
 * the /spaces/{id}/view fallback also works now because the viewer loads
 * its data through /api/spaces/view-data with invited-access rules.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Layers,
  FileText,
  Search,
  Mail,
  Inbox,
  Star,
  UserCheck,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type SharedSpace = {
  spaceId: string;
  spaceName: string;
  description: string | null;
  coverImage: string | null;
  ownerEmail: string | null;
  shareToken: string | null;
  lastAccessedAt: string;
  visitCount: number;
  invited: boolean;
  unopened: boolean;
  alertId: string | null;
  kind?: 'space' | 'file';
};

type WatchRow = {
  id: string;
  startup_name: string | null;
  space_id: string | null;
  manager_id: string | null;
  created_at: string;
};

type ExistsState = 'idle' | 'checking' | 'yes' | 'no' | 'self';
type TabKey = 'all' | 'pending' | 'opened' | 'watchlist';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SharedWithMePage() {
  const { toast } = useToast();

  const [myEmail, setMyEmail] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<SharedSpace[]>([]);
  const [watchRows, setWatchRows] = useState<WatchRow[]>([]);
  const [isInvestor, setIsInvestor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabKey>('all');

  // ── Invite-a-founder dialog ──
  const [inviteOpen, setInviteOpen] = useState(false);
  const [founderEmail, setFounderEmail] = useState('');
  const [founderMsg, setFounderMsg] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [founderExists, setFounderExists] = useState<ExistsState>('idle');

  useEffect(() => {
    const email = founderEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) { setFounderExists('idle'); return; }
    let cancelled = false;
    setFounderExists('checking');
    const t = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/users/exists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
          body: JSON.stringify({ email }),
        });
        const json = await res.json().catch(() => ({ ok: false }));
        if (cancelled) return;
        if (!json.ok) { setFounderExists('idle'); return; }
        setFounderExists(json.isSelf ? 'self' : json.exists ? 'yes' : 'no');
      } catch {
        if (!cancelled) setFounderExists('idle');
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [founderEmail]);

  const handleInviteFounder = async () => {
    const email = founderEmail.trim();
    if (!email) { toast({ variant: 'destructive', title: 'Enter the founder’s email' }); return; }
    setInviteSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/invite-founder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ email, message: founderMsg.trim() }),
      });
      const json = res.ok ? await res.json() : { ok: false, error: 'server' };
      if (!json.ok) {
        const msg = json.error === 'invalid_email' ? 'That email looks invalid.'
          : json.error === 'cannot_invite_self' ? 'You can’t invite yourself.'
          : 'Could not send the request. Please try again.';
        toast({ variant: 'destructive', title: 'Failed to send', description: msg });
        setInviteSending(false);
        return;
      }
      toast({
        title: 'Request sent',
        description: json.hasAccount
          ? `${email} was notified in VentureThrust and by email.`
          : `An email invitation was sent to ${email}.`,
      });
      setInviteOpen(false);
      setFounderEmail('');
      setFounderMsg('');
      setFounderExists('idle');
    } catch {
      toast({ variant: 'destructive', title: 'Something went wrong. Please try again.' });
    } finally {
      setInviteSending(false);
    }
  };

  const loadShared = useCallback(async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      const email = user?.email ?? null;
      if (!email || !user) { setIsLoading(false); return; }
      setMyEmail(email);

      try {
        const res = await fetch('/api/shared-with-me', {
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        });
        const json = await res.json().catch(() => ({ ok: false }));
        if (json.ok && Array.isArray(json.spaces)) setSpaces(json.spaces as SharedSpace[]);
      } catch { /* leave spaces as they were on failure */ }

      try {
        const [{ data: prof }, { data: wl }] = await Promise.all([
          supabase.from('profiles').select('is_investor').eq('id', user.id).maybeSingle(),
          supabase
            .from('dw_watchlist')
            .select('id, startup_name, space_id, manager_id, created_at')
            .order('created_at', { ascending: false }),
        ]);
        setIsInvestor((prof as { is_investor?: boolean } | null)?.is_investor === true);
        setWatchRows((wl ?? []) as WatchRow[]);
      } catch { /* table missing - watchlist tab stays empty */ }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadShared(); }, [loadShared]);

  // LIVE: newly sent decks/rooms appear without a refresh. Silent re-fetch
  // every 12 seconds while the page is open (and on tab refocus).
  useEffect(() => {
    const timer = setInterval(() => { void loadShared(true); }, 12_000);
    const onFocus = () => { void loadShared(true); };
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [loadShared]);

  // ── Search + tab filtering ────────────────────────────────────────────────
  const filteredSpaces = useMemo(() => {
    if (!search.trim()) return spaces;
    const q = search.toLowerCase();
    return spaces.filter(
      (s) =>
        s.spaceName.toLowerCase().includes(q) ||
        s.ownerEmail?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    );
  }, [spaces, search]);

  const newItems = useMemo(() => filteredSpaces.filter((s) => s.unopened), [filteredSpaces]);
  const openedItems = useMemo(() => filteredSpaces.filter((s) => !s.unopened), [filteredSpaces]);
  const filteredWatch = useMemo(() => {
    if (!search.trim()) return watchRows;
    const q = search.toLowerCase();
    return watchRows.filter((w) => (w.startup_name ?? '').toLowerCase().includes(q));
  }, [watchRows, search]);

  const handleOpenSpace = async (space: SharedSpace) => {
    if (space.alertId && space.unopened) {
      try { await supabase.from('alerts').update({ read_at: new Date().toISOString() }).eq('id', space.alertId); } catch {}
    }
    if (space.unopened) {
      setSpaces((prev) => prev.map((s) => (s.spaceId === space.spaceId ? { ...s, unopened: false } : s)));
    }
    if (space.shareToken) {
      // Through the gates (NDA, signature, password, etc.).
      window.open(`/shared/${space.shareToken}`, '_blank');
    } else {
      // Invited without an active link: the viewer grants access to invited
      // accounts through /api/spaces/view-data.
      window.open(`/spaces/${space.spaceId}/view`, '_blank');
    }
  };

  const handleCopyMyEmail = () => {
    if (!myEmail) return;
    navigator.clipboard.writeText(myEmail);
    toast({ title: 'Email copied', description: 'Share this with founders to receive data rooms.' });
  };

  // ── Row renderers ────────────────────────────────────────────────────────

  const SharedRow = ({ item }: { item: SharedSpace }) => (
    <button
      onClick={() => handleOpenSpace(item)}
      className="group flex w-full items-center gap-4 px-2 py-4 text-left hover:bg-gray-50"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50">
        {item.kind === 'file'
          ? <FileText className="h-4 w-4 text-[#4285F4]" />
          : <Layers className="h-4 w-4 text-[#4285F4]" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium group-hover:text-[#4285F4]">{item.spaceName}</p>
          {item.unopened && <span className="h-2 w-2 shrink-0 rounded-full bg-[#4285F4]" title="Not opened yet" />}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {item.kind === 'file' ? 'Document' : 'Data room'}
          {item.description ? ` · ${item.description}` : ''}
        </p>
      </div>
      <span className="hidden w-56 truncate text-sm text-muted-foreground md:block">
        {item.ownerEmail ?? 'Unknown sender'}
      </span>
      <span className="hidden w-36 shrink-0 text-sm text-muted-foreground sm:block">
        {formatDistanceToNow(new Date(item.lastAccessedAt), { addSuffix: true })}
      </span>
      <span className="hidden w-28 shrink-0 lg:block">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
          item.invited ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
        }`}>
          {item.invited ? 'Invited' : 'Sent by email'}
        </span>
      </span>
      <span className="w-24 shrink-0">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          item.unopened ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
        }`}>
          {item.unopened ? 'Pending' : 'Opened'}
        </span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-[#4285F4]" />
    </button>
  );

  const columnHeader = (
    <div className="flex items-center gap-4 border-b border-gray-200 px-2 py-2">
      <span className="w-9 shrink-0" />
      <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</span>
      <span className="hidden w-56 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:block">From</span>
      <span className="hidden w-36 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:block">Received</span>
      <span className="hidden w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">Via</span>
      <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
      <span className="w-4 shrink-0" />
    </div>
  );

  const emptyBlock = (icon: React.ReactNode, title: string, description: string) => (
    <div className="flex flex-col items-center justify-center border-b border-gray-200 py-24 text-center">
      {icon}
      <p className="mt-4 text-base font-semibold">{title}</p>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: 'all', label: 'All', count: filteredSpaces.length },
    { key: 'pending', label: 'Pending', count: newItems.length },
    { key: 'opened', label: 'Opened', count: openedItems.length },
    // Watchlist is an Investor plan feature; everyone else keeps 3 tabs.
    ...(isInvestor ? [{ key: 'watchlist' as TabKey, label: 'Watchlist', count: filteredWatch.length }] : []),
  ];

  return (
    <div className="flex w-full flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shared with me</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Data rooms and documents founders have shared with you.
          </p>
          {myEmail && (
            <button
              onClick={handleCopyMyEmail}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#4285F4]"
              title="Click to copy"
            >
              <Mail className="h-3.5 w-3.5" />
              You receive shares at <span className="font-medium text-gray-700">{myEmail}</span>
            </button>
          )}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search shared items"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-[#4285F4] text-[#4285F4]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              tab === t.key ? 'bg-blue-50 text-[#4285F4]' : 'bg-gray-100 text-gray-500'
            }`}>
              {isLoading ? '…' : t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tab === 'all' ? (
        filteredSpaces.length === 0
          ? emptyBlock(
              <Inbox className="h-10 w-10 text-gray-300" />,
              search ? 'Nothing matches your search' : 'Nothing shared with you yet',
              search
                ? 'Try a different keyword or clear the search.'
                : 'When a founder shares a data room or a deck with you, it appears here the moment they send it.'
            )
          : (
            <div>
              {columnHeader}
              <div className="divide-y divide-gray-200 border-b border-gray-200">
                {filteredSpaces.map((s) => <SharedRow key={s.spaceId} item={s} />)}
              </div>
            </div>
          )
      ) : tab === 'pending' ? (
        newItems.length === 0
          ? emptyBlock(
              <Inbox className="h-10 w-10 text-gray-300" />,
              search ? 'Nothing matches your search' : 'You are all caught up',
              search
                ? 'Try a different keyword or clear the search.'
                : 'Pitch decks and data rooms you have not opened yet will wait for you here.'
            )
          : (
            <div>
              {columnHeader}
              <div className="divide-y divide-gray-200 border-b border-gray-200">
                {newItems.map((s) => <SharedRow key={s.spaceId} item={s} />)}
              </div>
            </div>
          )
      ) : tab === 'opened' ? (
        openedItems.length === 0
          ? emptyBlock(
              <CheckCircle2 className="h-10 w-10 text-gray-300" />,
              search ? 'Nothing matches your search' : 'Nothing opened yet',
              search
                ? 'Try a different keyword or clear the search.'
                : 'Data rooms and documents you have opened will be listed here for quick access.'
            )
          : (
            <div>
              {columnHeader}
              <div className="divide-y divide-gray-200 border-b border-gray-200">
                {openedItems.map((s) => <SharedRow key={s.spaceId} item={s} />)}
              </div>
            </div>
          )
      ) : (
        filteredWatch.length === 0
          ? emptyBlock(
              <Star className="h-10 w-10 text-gray-300" />,
              search ? 'Nothing matches your search' : 'Your watchlist is empty',
              search
                ? 'Try a different keyword or clear the search.'
                : 'Open a shared data room and click Add to Watchlist to follow a startup here.'
            )
          : (
            <div>
              <div className="flex items-center gap-4 border-b border-gray-200 px-2 py-2">
                <span className="w-9 shrink-0" />
                <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Startup</span>
                <span className="hidden w-36 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:block">Added</span>
                <span className="w-40 shrink-0 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monitoring</span>
                <span className="w-4 shrink-0" />
              </div>
              <div className="divide-y divide-gray-200 border-b border-gray-200">
                {filteredWatch.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => { if (w.space_id) window.open(`/spaces/${w.space_id}/view`, '_blank'); }}
                    className="group flex w-full items-center gap-4 px-2 py-4 text-left hover:bg-gray-50"
                    disabled={!w.space_id}
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#FFF8E6]">
                      <Star className="h-4 w-4 text-[#F4B400]" />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium group-hover:text-[#4285F4]">
                      {w.startup_name || 'Unnamed startup'}
                    </p>
                    <span className="hidden w-36 shrink-0 text-sm text-muted-foreground sm:block">
                      {format(new Date(w.created_at), 'MMM d, yyyy')}
                    </span>
                    <span className="flex w-40 shrink-0 justify-end">
                      {w.manager_id ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <UserCheck className="h-3.5 w-3.5" />
                          Managed for you
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          Following
                        </span>
                      )}
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-[#4285F4]" />
                  </button>
                ))}
              </div>
            </div>
          )
      )}

      {/* Invite founders */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div>
          <p className="text-sm font-semibold">Looking for more deal flow?</p>
          <p className="text-sm text-muted-foreground">
            Invite founders to share their data rooms directly with you.
          </p>
        </div>
        <Button
          onClick={() => { setFounderEmail(''); setFounderMsg(''); setFounderExists('idle'); setInviteOpen(true); }}
        >
          <Mail className="mr-2 h-4 w-4" />
          Invite founders
        </Button>
      </div>

      {/* Invite-a-founder dialog (unchanged behavior) */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { if (!inviteSending) setInviteOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a founder</DialogTitle>
            <DialogDescription>
              Ask a founder to share their data room. If they&apos;re on VentureThrust they&apos;ll be
              notified in-app and by email; otherwise we&apos;ll email them an invite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="founder-email">Founder&apos;s email</Label>
              <Input
                id="founder-email"
                type="email"
                placeholder="founder@startup.com"
                value={founderEmail}
                onChange={(e) => setFounderEmail(e.target.value)}
                autoFocus
              />
              {founderExists === 'checking' && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking VentureThrust…
                </p>
              )}
              {founderExists === 'yes' && (
                <p className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> This email has a VentureThrust account. They&apos;ll be notified in-app.
                </p>
              )}
              {founderExists === 'self' && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600">
                  <XCircle className="h-3 w-3" /> That&apos;s your own email.
                </p>
              )}
              {founderExists === 'no' && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> No VentureThrust account yet. We&apos;ll email them an invite to join.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="founder-msg">
                Message <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="founder-msg"
                placeholder="Hi, I'd love to review your data room and learn more about your company."
                value={founderMsg}
                onChange={(e) => setFounderMsg(e.target.value)}
                maxLength={1000}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={inviteSending}>Cancel</Button>
            <Button onClick={handleInviteFounder} disabled={inviteSending || !founderEmail.trim() || founderExists === 'self'}>
              {inviteSending ? 'Sending…' : 'Send request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
