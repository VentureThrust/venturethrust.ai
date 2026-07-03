'use client';

/**
 * Shared With Me - modern two-section page.
 *
 *  • "Spaces"  : data rooms shared with this user. Loaded from the service-role
 *                route /api/shared-with-me (the client cannot read other owners'
 *                spaces directly because of RLS, which is why this used to be
 *                empty). Covers links I opened with my email AND explicit invites.
 *  • "Reports" : due diligence reports shared with this user (coming soon).
 *
 * Invited-but-unopened spaces show a "New" badge and clear on open.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Layers,
  FileText,
  Search,
  Mail,
  ExternalLink,
  Inbox,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { SharedIllustration } from '@/components/illustrations';

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
  /** 'space' for data rooms, 'file' for single decks sent by email. */
  kind?: 'space' | 'file';
};

type SharedReport = {
  reportId: string;
  title: string;
  ownerEmail: string | null;
  sharedAt: string;
  status: string | null;
};

type ExistsState = 'idle' | 'checking' | 'yes' | 'no' | 'self';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initialsFromEmail(email: string | null | undefined): string {
  if (!email) return '?';
  const local = email.split('@')[0] ?? '';
  return (local[0] ?? '?').toUpperCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Empty-state component ────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  illustration?: React.ReactNode;
  title: string;
  description: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8 gap-4">
      {illustration ? (
        <div className="w-44">{illustration}</div>
      ) : (
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <Icon className="h-9 w-9 text-blue-500" />
        </div>
      )}
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </div>
      {cta && (
        <Button onClick={cta.onClick} className="mt-2">
          {cta.label} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
}

// ─── Space card ───────────────────────────────────────────────────────────────

function SharedSpaceCard({ space, onOpen }: { space: SharedSpace; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group text-left bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col"
    >
      {/* Cover area */}
      <div className="relative h-32 overflow-hidden">
        {space.coverImage ? (
          <img
            src={space.coverImage}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 2px, transparent 2px, transparent 16px)',
              }}
            />
            {space.kind === 'file' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="h-10 w-10 text-white/80" />
              </div>
            )}
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1.5">
          {space.unopened && (
            <Badge className="bg-red-500 text-white text-xs gap-1 border-0 hover:bg-red-500">
              New
            </Badge>
          )}
          <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs gap-1">
            <ShieldCheck className="h-3 w-3" />
            Secure
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
            {space.spaceName}
          </h3>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {space.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{space.description}</p>
        )}

        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-orange-400 to-red-500 text-white">
              {initialsFromEmail(space.ownerEmail)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate flex-1">
            {space.ownerEmail ?? 'Anonymous owner'}
          </span>
          {space.invited ? (
            <Badge variant="outline" className="text-[10px] py-0 h-4 border-blue-200 text-blue-600">
              Invited
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] py-0 h-4 border-green-200 text-green-700">
              Sent by email
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(space.lastAccessedAt), { addSuffix: true })}
          </span>
          {space.visitCount > 1 && (
            <Badge variant="outline" className="text-[10px] py-0 h-4">
              {space.visitCount} visits
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Report card ──────────────────────────────────────────────────────────────

function SharedReportCard({ report, onOpen }: { report: SharedReport; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group text-left bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-purple-400 hover:shadow-lg transition-all duration-200"
    >
      <div className="relative h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center">
        <FileText className="h-10 w-10 text-white/80" />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            AI Report
          </Badge>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-purple-600 transition-colors">
          {report.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 pt-2 border-t border-gray-100">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-purple-400 to-pink-500 text-white">
              {initialsFromEmail(report.ownerEmail)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate flex-1">
            {report.ownerEmail ?? 'Anonymous'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Shared {formatDistanceToNow(new Date(report.sharedAt), { addSuffix: true })}
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SharedWithMePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [myEmail, setMyEmail] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<SharedSpace[]>([]);
  const [reports, setReports] = useState<SharedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // ── Invite-a-founder dialog ──
  const [inviteOpen, setInviteOpen] = useState(false);
  const [founderEmail, setFounderEmail] = useState('');
  const [founderMsg, setFounderMsg] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [founderExists, setFounderExists] = useState<ExistsState>('idle');

  // Live "does this email belong to a VentureThrust user?" check (debounced).
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

  const loadShared = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const email = authData?.user?.email ?? null;
      const authUserId = authData?.user?.id ?? null;
      if (!email || !authUserId) { setIsLoading(false); return; }
      setMyEmail(email);

      // Spaces: load from the service-role route (RLS blocks reading other
      // owners' rows directly from the browser).
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/shared-with-me', {
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        });
        const json = await res.json().catch(() => ({ ok: false }));
        if (json.ok && Array.isArray(json.spaces)) setSpaces(json.spaces as SharedSpace[]);
      } catch { /* leave spaces empty on failure */ }

      // Reports: still gracefully empty until AI due diligence ships.
      try {
        const { data: reportRows } = await supabase
          .from('diligence_reports')
          .select('id, title, created_at, status, shared_with, created_by')
          .contains('shared_with', [email])
          .neq('created_by', authUserId)
          .order('created_at', { ascending: false });
        if (reportRows && reportRows.length > 0) {
          const ownerIds = [...new Set(reportRows.map((r) => r.created_by as string).filter(Boolean))];
          const ownerEmailMap = new Map<string, string>();
          if (ownerIds.length > 0) {
            const { data: profs } = await supabase.from('profiles').select('id, email').in('id', ownerIds);
            (profs ?? []).forEach((p) => { if (p.email) ownerEmailMap.set(p.id as string, p.email as string); });
          }
          setReports(reportRows.map((r) => ({
            reportId: r.id as string,
            title: (r.title as string) || 'Due Diligence Report',
            ownerEmail: ownerEmailMap.get(r.created_by as string) ?? null,
            sharedAt: r.created_at as string,
            status: (r.status as string) ?? null,
          })));
        }
      } catch { /* table/column missing - silently empty */ }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadShared(); }, [loadShared]);

  // ── Filtered lists by search query ──────────────────────────────────────
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

  const filteredReports = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(
      (r) => r.title.toLowerCase().includes(q) || r.ownerEmail?.toLowerCase().includes(q)
    );
  }, [reports, search]);

  const handleOpenSpace = async (space: SharedSpace) => {
    // Opening an invited space clears its "unopened" state (marks the alert read).
    if (space.alertId && space.unopened) {
      try { await supabase.from('alerts').update({ read_at: new Date().toISOString() }).eq('id', space.alertId); } catch {}
    }
    // Sent-by-email items flip server-side (the /shared open tracking sets
    // opened_at); mirror it locally so the card moves to Opened immediately.
    if (space.unopened) {
      setSpaces((prev) => prev.map((s) => (s.spaceId === space.spaceId ? { ...s, unopened: false } : s)));
    }
    if (space.shareToken) {
      // Go through the gates (NDA, signature, password, etc.).
      window.open(`/shared/${space.shareToken}`, '_blank');
    } else {
      window.open(`/spaces/${space.spaceId}/view`, '_blank');
    }
  };

  const handleCopyMyEmail = () => {
    if (!myEmail) return;
    navigator.clipboard.writeText(myEmail);
    toast({ title: 'Email copied!', description: 'Share this with founders to receive data rooms.' });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.15) 0px, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139,92,246,0.15) 0px, transparent 50%)',
          }}
        />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0">
              <Inbox className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Shared With Me</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Everything founders and partners have shared with you: data rooms, due diligence reports, and more.
              </p>
              {myEmail && (
                <button
                  onClick={handleCopyMyEmail}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-50 transition-colors"
                  title="Click to copy"
                >
                  <Mail className="h-3 w-3" />
                  Sharing to: <span className="font-mono">{myEmail}</span>
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shared items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-gray-200"
            />
          </div>
        </div>
      </div>

      {/* ─── Tabs ─────────────────────────────────────────────── */}
      <Tabs defaultValue="spaces" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="spaces" className="rounded-lg gap-2 px-4">
            <Layers className="h-4 w-4" />
            Spaces
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {isLoading ? '…' : filteredSpaces.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg gap-2 px-4">
            <FileText className="h-4 w-4" />
            Reports
            <Badge variant="secondary" className="ml-1 h-5 bg-amber-100 px-1.5 text-[10px] text-amber-700">
              Soon
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ─── Spaces tab ─── */}
        <TabsContent value="spaces" className="mt-6">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-500" />
                Spaces Shared With Me
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Data rooms founders have shared with you, secured by share links.
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden">
                      <Skeleton className="h-32 w-full" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredSpaces.length === 0 ? (
                <EmptyState
                  icon={Layers}
                  illustration={<SharedIllustration />}
                  title={search ? 'No spaces match your search' : 'No data rooms shared yet'}
                  description={
                    search
                      ? 'Try a different keyword or clear the search to see all shared items.'
                      : 'When a founder shares a data room with you, it will appear here. Share your email so founders know where to send their data room links.'
                  }
                  cta={
                    !search && myEmail
                      ? { label: 'Copy my email to share', onClick: handleCopyMyEmail }
                      : undefined
                  }
                />
              ) : (
                <div className="space-y-8">
                  {/* Not opened yet */}
                  {filteredSpaces.some((s) => s.unopened) && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <h3 className="text-sm font-semibold text-gray-900">Not opened yet</h3>
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                          {filteredSpaces.filter((s) => s.unopened).length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSpaces.filter((s) => s.unopened).map((space) => (
                          <SharedSpaceCard
                            key={space.spaceId}
                            space={space}
                            onOpen={() => handleOpenSpace(space)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Opened */}
                  {filteredSpaces.some((s) => !s.unopened) && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <h3 className="text-sm font-semibold text-gray-900">Opened</h3>
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                          {filteredSpaces.filter((s) => !s.unopened).length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSpaces.filter((s) => !s.unopened).map((space) => (
                          <SharedSpaceCard
                            key={space.spaceId}
                            space={space}
                            onOpen={() => handleOpenSpace(space)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Reports tab ─── */}
        <TabsContent value="reports" className="mt-6">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                Reports Shared With Me
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                  Coming soon
                </span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-generated due diligence reports that analysts share with you.
              </p>
            </CardHeader>
            <CardContent>
              {filteredReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredReports.map((report) => (
                    <SharedReportCard
                      key={report.reportId}
                      report={report}
                      onOpen={() => router.push(`/dashboard/due-diligence/${report.reportId}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-200 py-14 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-purple-50">
                    <Sparkles className="h-7 w-7 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">AI Due Diligence is coming soon</h3>
                    <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
                      Soon you&apos;ll be able to receive AI-generated diligence reports that founders and analysts
                      share with you, right here. We&apos;re putting the finishing touches on it.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Invite Founders CTA ─── */}
      <Card className="border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
              <Mail className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Looking for more deal flow?</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Invite founders to share their data rooms directly to your inbox.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button variant="outline" onClick={() => router.push('/dashboard/data-rooms')}>
              View demo data room
            </Button>
            <Button
              onClick={() => { setFounderEmail(''); setFounderMsg(''); setFounderExists('idle'); setInviteOpen(true); }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Invite founders
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Invite-a-founder dialog ─── */}
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
              {/* Live VentureThrust-account hint */}
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
