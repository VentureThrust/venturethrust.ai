'use client';

/**
 * GlobalSearch - the header "Search everything" box. Debounced search across the
 * user's spaces and files (scoped by RLS), with a results dropdown. Click a
 * result to jump to the space (or the file's space / content library).
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Search, Loader2, Boxes, FileText } from 'lucide-react';

type Result = { kind: 'space' | 'file'; id: string; name: string; spaceId?: string | null };

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim().replace(/[,()%*]/g, ' ').trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const like = `%${term}%`;
      const [sp, fl] = await Promise.all([
        supabase
          .from('spaces')
          .select('id, name, title')
          .or(`name.ilike.${like},title.ilike.${like}`)
          .neq('title', 'CONTENT_LIBRARY')
          .limit(6),
        supabase.from('files').select('id, name, space_id').ilike('name', like).limit(6),
      ]);
      const out: Result[] = [];
      for (const s of (sp.data ?? []) as { id: string; name?: string; title?: string }[]) {
        out.push({ kind: 'space', id: s.id, name: s.name || s.title || 'Untitled space' });
      }
      for (const f of (fl.data ?? []) as { id: string; name: string; space_id?: string | null }[]) {
        out.push({ kind: 'file', id: f.id, name: f.name, spaceId: f.space_id ?? null });
      }
      setResults(out);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (r: Result) => {
    setOpen(false);
    setQ('');
    if (r.kind === 'space') router.push(`/spaces/${r.id}/edit`);
    else if (r.spaceId) router.push(`/spaces/${r.spaceId}/edit`);
    else router.push(`/content-library?fileId=${r.id}`);
  };

  const show = open && q.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => { if (q.trim().length >= 2) setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' && results.length > 0) go(results[0]);
        }}
        placeholder="Search spaces and files..."
        className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {show && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border bg-white shadow-lg">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">No matches for &ldquo;{q.trim()}&rdquo;.</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((r) => (
                <li key={r.kind + r.id}>
                  <button
                    onClick={() => go(r)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
                  >
                    {r.kind === 'space' ? (
                      <Boxes className="h-4 w-4 shrink-0 text-[#4285F4]" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                    )}
                    <span className="flex-1 truncate text-sm text-gray-900">{r.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">{r.kind}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
