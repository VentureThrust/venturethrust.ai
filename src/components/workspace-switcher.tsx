'use client';

/**
 * DocSend-style workspace switcher. Lets a user who belongs to more than one
 * workspace (their own + any they've joined via invite) flip between them.
 * Switching persists the choice and hard-reloads into /spaces so every
 * provider re-fetches under the new scope. Hidden when the user only has their
 * own workspace (nothing to switch).
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getActiveWorkspaceId, setActiveWorkspace } from '@/lib/workspace';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';

type WS = { ownerId: string; label: string; email: string | null; isOwn: boolean };

export function WorkspaceSwitcher() {
  const [userId, setUserId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WS[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { if (!cancelled) setLoading(false); return; }
      if (cancelled) return;
      setUserId(session.user.id);
      setActiveId(getActiveWorkspaceId(session.user.id));
      try {
        const res = await fetch('/api/workspaces', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        });
        const json = await res.json();
        if (!cancelled && json.ok) setWorkspaces(json.workspaces as WS[]);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Nothing to switch between → don't render.
  if (loading || workspaces.length <= 1 || !userId) return null;

  const current =
    workspaces.find((w) => w.ownerId === activeId) ??
    workspaces.find((w) => w.isOwn) ??
    workspaces[0];

  const onSelect = (ownerId: string) => {
    if (ownerId === current.ownerId) return;
    setActiveWorkspace(userId, ownerId);
    // Hard reload so SpacesProvider / FoldersProvider re-resolve the scope.
    window.location.href = '/spaces';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors max-w-[240px]">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate font-medium">{current.isOwn ? 'My Workspace' : current.label}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((w) => (
          <DropdownMenuItem
            key={w.ownerId}
            onClick={() => onSelect(w.ownerId)}
            className="flex items-center gap-2.5 py-2 cursor-pointer"
          >
            <span className="h-7 w-7 rounded-md bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 font-semibold">
              {((w.isOwn ? w.email?.[0] : w.email?.[0]) ?? (w.isOwn ? 'M' : 'S')).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{w.isOwn ? 'My Workspace' : w.label}</p>
              {w.email && <p className="truncate text-xs text-muted-foreground">{w.email}</p>}
            </div>
            {w.ownerId === current.ownerId && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
