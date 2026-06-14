'use client';

/**
 * Settings - real account + team management.
 *
 *  • Profile : the signed-in user's real name (editable) and email (read-only,
 *              for security - changing the login email is not allowed here).
 *  • Team    : invite teammates to the workspace and see who has joined / is
 *              pending. Uses the same /api/invite/send flow as the space editor.
 *
 * Branding lives per-space in the space editor, and the plan lives on the
 * Billing page, so those tabs were removed to avoid duplicate, fake screens.
 */

import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Lock, Loader2, Clock, Users } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

type Member = { email: string; role: string; status: 'pending' | 'accepted' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SettingsPage() {
  const { toast } = useToast();

  // ── Profile ──
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setEmail(u?.email ?? '');
      const fn = (u?.user_metadata as Record<string, unknown> | undefined)?.full_name;
      setFullName(typeof fn === 'string' ? fn : '');
      setLoadingProfile(false);
    });
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    setSavingProfile(false);
    if (error) toast({ variant: 'destructive', title: 'Could not save', description: error.message });
    else toast({ title: 'Profile updated' });
  };

  // ── Team ──
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const refreshMembers = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: invs }, { data: mems }] = await Promise.all([
      supabase.from('space_invitations').select('invited_email, role, status').eq('workspace_owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('workspace_members').select('member_email, role').eq('workspace_owner_id', user.id),
    ]);
    const list: Member[] = [];
    const accepted = new Set<string>();
    for (const m of (mems ?? []) as Array<{ member_email: string; role: string }>) {
      list.push({ email: m.member_email, role: m.role, status: 'accepted' });
      accepted.add(String(m.member_email).toLowerCase());
    }
    for (const i of (invs ?? []) as Array<{ invited_email: string; role: string; status: string }>) {
      if (i.status !== 'accepted' && !accepted.has(String(i.invited_email).toLowerCase())) {
        list.push({ email: i.invited_email, role: i.role, status: 'pending' });
      }
    }
    setMembers(list);
  }, []);

  useEffect(() => { refreshMembers(); }, [refreshMembers]);

  const sendInvite = async () => {
    const em = inviteEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(em)) { toast({ variant: 'destructive', title: 'Enter a valid email address' }); return; }
    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/invite/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ email: em, role: 'editor' }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      if (json.code === 'already_member') {
        toast({ title: 'Already a member', description: `${em} is already in your team.` });
      } else if (json.code === 'already_invited') {
        toast({ title: 'Already invited', description: `${em} already has a pending invite.` });
      } else if (json.code === 'seat_limit') {
        toast({ variant: 'destructive', title: 'Seat limit reached', description: `Your plan includes ${json.seats} member${json.seats === 1 ? '' : 's'}. Upgrade for more.` });
      } else if (!res.ok || !json.ok) {
        throw new Error(json.detail || json.error || 'Could not send the invite.');
      } else {
        toast({ title: 'Invitation sent', description: `We emailed an invite to ${em}.` });
        setInviteEmail('');
        setInviteOpen(false);
        refreshMembers();
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not invite', description: e instanceof Error ? e.message : 'Please try again.' });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and team.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* ── Profile ── */}
        <TabsContent value="profile">
          <div className="border-t border-gray-200 pt-6 max-w-2xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Profile</h3>
              <p className="text-sm text-muted-foreground">Update your personal information.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={loadingProfile ? 'Loading…' : 'Your name'}
                  disabled={loadingProfile}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  Email <Lock className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Input id="email" type="email" value={email} readOnly disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Your login email cannot be changed here for security. Contact support if it must change.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Button onClick={saveProfile} disabled={savingProfile || loadingProfile}>
                {savingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Team ── */}
        <TabsContent value="team">
          <div className="border-t border-gray-200 pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Team Members</h3>
              <p className="text-sm text-muted-foreground">Invite and manage your team members.</p>
            </div>
            <div className="space-y-4">
              <Button onClick={() => { setInviteEmail(''); setInviteOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Invite Member
              </Button>

              {members.length > 0 ? (
                <div className="space-y-1 max-w-2xl">
                  {members.map((member) => (
                    <div key={member.email} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-blue-600 text-white text-sm">
                            {(member.email[0] ?? '?').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{member.email}</p>
                          <p className="text-xs capitalize text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      {member.status === 'pending' ? (
                        <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50">
                          <Clock className="h-3 w-3" /> Pending
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                          Joined
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                  <Users className="mb-2 h-8 w-8 opacity-40" />
                  <p>No team members yet.</p>
                  <p className="text-sm">Invite members to collaborate.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Invite dialog ── */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { if (!inviting) setInviteOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>
              They will get an email invite. When they accept, they join your workspace and can collaborate on your spaces.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="name@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !inviting) sendInvite(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={inviting}>Cancel</Button>
            <Button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : 'Send invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
