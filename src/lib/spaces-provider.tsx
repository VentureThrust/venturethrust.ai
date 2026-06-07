//src\lib\spaces-provider.tsx
'use client';

import { useState, createContext, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { File, Folder, Visit } from './folder-provider';
import { teamMembers, type TeamMember } from '@/lib/data';
import { type ShareLink } from '@/lib/documents-provider';
import { supabase } from '@/lib/supabaseClient';
import { getEffectiveOwnerId } from '@/lib/workspace';

export type Space = {
  id: string;
  spaceId: string;
  name: string;
  description: string;
  coverImage: string;
  logo?: string;
  files: (File & { itemType?: 'file' | 'section' })[];
  folders: Folder[];
  isEnabled: boolean;
  links: ShareLink[];
  lastUpdated: string;
  collaborators: TeamMember[];
  visits?: Visit[];
  nda?: {
    required: boolean;
    fileName?: string;
    fileUrl?: string;
  };
};

type SpacesContextType = {
  spaces: Space[];
  refreshSpace: (spaceId: string) => Promise<void>; // ✅ exported
  addSpace: (newSpace: Partial<Omit<Space, 'id' | 'spaceId' | 'links' | 'lastUpdated' | 'collaborators'>>) => Promise<string>;
  findSpace: (id: string, includeContent?: boolean) => Space | undefined;
  updateSpace: (updatedSpace: Partial<Space> & { id: string }) => void;
  deleteSpace: (id: string) => Promise<void>;
  addFilesToSpace: (spaceId: string, files: File[], parentId?: string | null) => Promise<void>;
  addFolderToSpace: (spaceId: string, folderName: string, parentId?: string | null) => Promise<string | undefined>;
  renameItemInSpace: (spaceId: string, itemId: string, newName: string) => Promise<void>;
  deleteItemFromSpace: (spaceId: string, itemId: string, parentId: string) => Promise<void>;
  addLinkToSpace: (spaceId: string, link: ShareLink) => void;
  // ── Reorder + section operations ─────────────────────────────────────
  // These three are referenced by the space-edit page (drag-and-drop,
  // section headers, move-up/down menus). Until a real `position` column
  // is wired into the schema they're no-op stubs that warn instead of
  // crashing the page when users interact with those affordances.
  reorderItemsInSpace: (
    spaceId: string,
    folderId: string | null,
    activeId: string,
    overId: string
  ) => Promise<void>;
  addSectionHeaderToSpace: (
    spaceId: string,
    name: string,
    parentId: string | null,
    position?: 'end' | 'above' | 'below',
    anchorId?: string
  ) => Promise<void>;
  moveItemInSpace: (
    spaceId: string,
    itemId: string,
    parentId: string | null,
    direction: 'up' | 'down'
  ) => Promise<void>;
};

const SpacesContext = createContext<SpacesContextType | undefined>(undefined);

async function loadSpaceContent(spaceId: string): Promise<{ files: File[], folders: Folder[] }> {
  // Load folders, files AND section headers, each ordered by `position` (with
  // created_at as a tiebreak for legacy rows). Files + sections at the same
  // level are merged into one ordered list so they interleave correctly.
  const [foldersRes, filesRes, sectionsRes] = await Promise.all([
    supabase.from('folders').select('*').eq('space_id', spaceId)
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    supabase.from('files').select('*').eq('space_id', spaceId)
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    // space_sections may not exist yet (until the migration runs) - any error
    // simply yields zero sections, so folders/files still load fine.
    supabase.from('space_sections').select('*').eq('space_id', spaceId)
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
  ]);

  if (foldersRes.error) {
    console.error('Error loading folders:', foldersRes.error);
    return { files: [], folders: [] };
  }
  if (filesRes.error) {
    console.error('Error loading files:', filesRes.error);
    return { files: [], folders: (foldersRes.data as Folder[]) || [] };
  }

  const folders = foldersRes.data ?? [];
  const files = filesRes.data ?? [];
  const sections = sectionsRes.error ? [] : (sectionsRes.data ?? []);

  // Ordered list of items (files + section headers) at a given level.
  const levelItems = (folderId: string | null): File[] => {
    const fileItems = files
      .filter((file: any) => (file.folder_id ?? null) === folderId)
      .map((file: any) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        createdAt: file.created_at,
        views: file.views || 0,
        storagePath: file.storage_path,
        isVisible: file.is_visible !== false,
        itemType: 'file' as const,
        position: (file.position as number | null) ?? null,
        _ts: file.created_at as string,
      }));
    const sectionItems = sections
      .filter((s: any) => (s.parent_id ?? null) === folderId)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        type: 'section',
        itemType: 'section' as const,
        position: (s.position as number | null) ?? null,
        _ts: s.created_at as string,
      }));
    return [...fileItems, ...sectionItems].sort((a, b) => {
      const pa = a.position ?? Number.MAX_SAFE_INTEGER;
      const pb = b.position ?? Number.MAX_SAFE_INTEGER;
      if (pa !== pb) return pa - pb;
      return new Date(a._ts).getTime() - new Date(b._ts).getTime();
    }) as unknown as File[];
  };

  const buildFolderTree = (parentId: string | null = null): Folder[] =>
    folders
      .filter((f: any) => (f.parent_id ?? null) === parentId)
      .map((f: any) => ({
        id: f.id,
        name: f.name,
        type: 'personal' as const,
        // is_visible defaults to TRUE; treat missing column (legacy) as visible.
        isVisible: f.is_visible !== false,
        // position + _ts let the editor interleave folders with files/sections
        // by their saved order (so a section can sit above a folder).
        position: (f.position as number | null) ?? null,
        _ts: f.created_at as string,
        children: buildFolderTree(f.id),
        files: levelItems(f.id),
      })) as unknown as Folder[];

  const rootFolders = buildFolderTree(null);
  // Root-level files + sections (folder_id / parent_id NULL) live on space.files.
  return { files: levelItems(null), folders: rootFolders };
}

function dbRowToSpace(row: Record<string, unknown>): Space {
  const owner = teamMembers.find(m => m.role === 'Owner');
  return {
    id: row.id as string,
    spaceId: row.id as string,
    name: (row.name as string) ?? (row.title as string) ?? 'Untitled Space',
    description: (row.description as string) ?? '',
    coverImage: (row.cover_image as string) ?? 'https://picsum.photos/seed/space-cover-3/1600/400',
    logo: row.logo as string | undefined,
    files: [],
    folders: [],
    isEnabled: (row.is_enabled as boolean) ?? true,
    links: [],
    visits: [],
    lastUpdated: (row.last_updated as string) ?? new Date().toISOString(),
    collaborators: owner ? [owner] : [],
    nda: undefined,
  };
}

export const SpacesProvider = ({ children }: { children: ReactNode }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // Scope to the effective workspace owner: for an invited collaborator
      // this resolves to the inviter's id, so they load the SAME spaces.
      const ownerId = await getEffectiveOwnerId();
      if (!ownerId) return;

      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('created_by', ownerId)
        // Hide the internal Content Library sentinel - it's not a real data room.
        .neq('title', 'CONTENT_LIBRARY')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading spaces:', error);
        return;
      }

      const spacesWithContent = await Promise.all(
        (data ?? []).map(async (row) => {
          const space = dbRowToSpace(row as Record<string, unknown>);
          const content = await loadSpaceContent(space.id);
          return { ...space, ...content };
        })
      );

      setSpaces(spacesWithContent);
    };

    loadData();
  }, []);

  const refreshSpace = useCallback(async (spaceId: string) => {
    const content = await loadSpaceContent(spaceId);
    setSpaces(prevSpaces =>
      prevSpaces.map(space =>
        space.id === spaceId
          ? { ...space, ...content, lastUpdated: new Date().toISOString() }
          : space
      )
    );
  }, []);

  const addSpace = useCallback(async (
    newSpaceData: Partial<Omit<Space, 'id' | 'spaceId' | 'links' | 'lastUpdated' | 'collaborators'>>
  ): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const ownerId = (await getEffectiveOwnerId()) ?? user.id;

    const spaceName = newSpaceData.name ?? 'Untitled Space';

    const { data, error } = await supabase
      .from("spaces")
      .insert({
        name: spaceName,
        title: spaceName,
        created_by: ownerId,
      })
      .select()
      .single();

    if (error) throw error;

    const { error: folderError } = await supabase.from("folders").insert({
      id: crypto.randomUUID(),
      user_id: ownerId,
      name: "Root",
      space_id: data.id,
      parent_id: null,
    });

    if (folderError) throw folderError;

    const owner = teamMembers.find(m => m.role === 'Owner');
    const newSpace: Space = {
      name: spaceName,
      description: newSpaceData.description ?? '',
      files: [],
      folders: [],
      isEnabled: newSpaceData.isEnabled ?? true,
      links: [],
      visits: [],
      coverImage: newSpaceData.coverImage || 'https://picsum.photos/seed/space-cover-3/1600/400',
      ...newSpaceData,
      id: data.id,
      spaceId: data.id,
      lastUpdated: new Date().toISOString(),
      collaborators: owner ? [owner] : [],
    };

    setSpaces(prevSpaces => [...prevSpaces, newSpace]);
    return data.id;
  }, []);

  const findSpace = useCallback((id: string, includeContent: boolean = false) => {
    return spaces.find(s => s.id === id || s.spaceId === id);
  }, [spaces]);

  const updateSpace = useCallback((updatedSpace: Partial<Space> & { id: string }) => {
    setSpaces(prevSpaces =>
      prevSpaces.map(space =>
        space.id === updatedSpace.id
          ? { ...space, ...updatedSpace, lastUpdated: new Date().toISOString() }
          : space
      )
    );

    const dbUpdates: Record<string, unknown> = { last_updated: new Date().toISOString() };
    if (updatedSpace.name !== undefined) {
      dbUpdates.name = updatedSpace.name;
      dbUpdates.title = updatedSpace.name;
    }
    if (updatedSpace.description !== undefined) dbUpdates.description = updatedSpace.description;
    if (updatedSpace.isEnabled !== undefined) dbUpdates.is_enabled = updatedSpace.isEnabled;

    if (Object.keys(dbUpdates).length > 1) {
      supabase
        .from('spaces')
        .update(dbUpdates)
        .eq('id', updatedSpace.id)
        .then(({ error }) => { if (error) console.error('Error updating space:', error); });
    }
  }, []);

  const deleteSpace = useCallback(async (id: string) => {
    await supabase.from("spaces").delete().eq("id", id);
    setSpaces(prev => prev.filter(space => space.id !== id));
  }, []);

  const addFilesToSpace = useCallback(async (spaceId: string, files: File[], parentId?: string | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const ownerId = (await getEffectiveOwnerId()) ?? user.id;

    let resolvedFolderId = parentId ?? null;

    if (resolvedFolderId) {
      const { data: folderCheck } = await supabase
        .from('folders')
        .select('id')
        .eq('id', resolvedFolderId)
        .maybeSingle();
      if (!folderCheck) {
        console.warn('parentId folder not found in DB, falling back to root:', resolvedFolderId);
        resolvedFolderId = null;
      }
    }

    if (!resolvedFolderId) {
      const { data: rootFolder, error: rootError } = await supabase
        .from('folders')
        .select('id')
        .eq('space_id', spaceId)
        .is('parent_id', null)
        .limit(1)
        .maybeSingle();

      if (rootFolder) {
        resolvedFolderId = rootFolder.id;
      } else {
        const newFolderId = crypto.randomUUID();
        const { error: folderError } = await supabase.from('folders').insert({
          id: newFolderId,
          user_id: ownerId,
          name: 'Root',
          space_id: spaceId,
          parent_id: null,
        });
        if (folderError) throw folderError;
        resolvedFolderId = newFolderId;
      }
    }

    for (const file of files) {
      const { error } = await supabase.from("files").insert({
        id: crypto.randomUUID(),
        user_id: ownerId,
        folder_id: resolvedFolderId,
        space_id: spaceId,
        name: file.name,
        type: file.type,
        storage_path: file.storagePath,
      });

      if (error) {
        console.error('Error adding file - message:', error.message);
        console.error('Error adding file - code:', error.code);
        console.error('Error adding file - details:', error.details);
        throw error;
      }
    }

    await refreshSpace(spaceId);
  }, [refreshSpace]);

  const addFolderToSpace = useCallback(async (spaceId: string, folderName: string, parentId?: string | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const ownerId = (await getEffectiveOwnerId()) ?? user.id;

    const folderId = crypto.randomUUID();
    const { error } = await supabase.from("folders").insert({
      id: folderId,
      user_id: ownerId,
      name: folderName,
      space_id: spaceId,
      parent_id: parentId ?? null,
    });

    if (error) {
      console.error('Error adding folder:', error);
      throw error;
    }

    await refreshSpace(spaceId);
    return folderId;
  }, [refreshSpace]);

  const renameItemInSpace = useCallback(async (spaceId: string, itemId: string, newName: string) => {
    const { data: folder } = await supabase.from("folders").select("id").eq("id", itemId).maybeSingle();
    if (folder) {
      await supabase.from("folders").update({ name: newName }).eq("id", itemId);
    } else {
      const { data: section } = await supabase.from("space_sections").select("id").eq("id", itemId).maybeSingle();
      if (section) {
        await supabase.from("space_sections").update({ name: newName }).eq("id", itemId);
      } else {
        await supabase.from("files").update({ name: newName }).eq("id", itemId);
      }
    }
    await refreshSpace(spaceId);
  }, [refreshSpace]);

  const deleteItemFromSpace = useCallback(async (spaceId: string, itemId: string, _parentId: string) => {
    const { data: folder } = await supabase.from("folders").select("id").eq("id", itemId).maybeSingle();
    if (folder) {
      await supabase.from("folders").delete().eq("id", itemId);
    } else {
      const { data: section } = await supabase.from("space_sections").select("id").eq("id", itemId).maybeSingle();
      if (section) {
        await supabase.from("space_sections").delete().eq("id", itemId);
      } else {
        await supabase.from("files").delete().eq("id", itemId);
      }
    }
    await refreshSpace(spaceId);
  }, [refreshSpace]);

  const addLinkToSpace = useCallback((spaceId: string, link: ShareLink) => {
    setSpaces(prev =>
      prev.map(space =>
        space.id === spaceId
          ? { ...space, links: [...(space.links || []), link] }
          : space
      )
    );
  }, []);

  // ── Reorder / move-up-down implementations ───────────────────────────
  // Strategy: load all siblings (folders + files) at the same level,
  // ordered by their current `position`. Build a unified array of refs,
  // compute the new order based on the requested operation, then write
  // 1..N sequentially back to each row's `position`. Sequential
  // re-numbering is simple, fast (a single batched UPDATE per side),
  // and immune to "drift" issues that fractional positions (1.5, etc.)
  // can develop after many reorders.

  type Sibling = { id: string; kind: 'folder' | 'file' | 'section' };

  /** 'root' (the UI's id for the top level) maps to NULL parent in the DB. */
  const normalizeLevel = (level: string | null): string | null =>
    level === 'root' ? null : level;

  /** Fetch all sibling items (folders + files + sections) at the given level,
   *  ordered by current position. */
  const fetchSiblingsAtLevel = async (
    spaceId: string,
    folderIdRaw: string | null
  ): Promise<Sibling[]> => {
    const folderId = normalizeLevel(folderIdRaw);
    // PostgREST distinguishes between IS NULL (`.is`) and equality (`.eq`).
    const foldersQuery =
      folderId === null
        ? supabase.from('folders').select('id, position, created_at').eq('space_id', spaceId).is('parent_id', null)
        : supabase.from('folders').select('id, position, created_at').eq('space_id', spaceId).eq('parent_id', folderId);

    const filesQuery =
      folderId === null
        ? supabase.from('files').select('id, position, created_at').eq('space_id', spaceId).is('folder_id', null)
        : supabase.from('files').select('id, position, created_at').eq('space_id', spaceId).eq('folder_id', folderId);

    const sectionsQuery =
      folderId === null
        ? supabase.from('space_sections').select('id, position, created_at').eq('space_id', spaceId).is('parent_id', null)
        : supabase.from('space_sections').select('id, position, created_at').eq('space_id', spaceId).eq('parent_id', folderId);

    const [foldersRes, filesRes, sectionsRes] = await Promise.all([foldersQuery, filesQuery, sectionsQuery]);
    const foldersData = foldersRes.data ?? [];
    const filesData = filesRes.data ?? [];
    const sectionsData = sectionsRes.error ? [] : (sectionsRes.data ?? []);

    // Combine and sort by (position, created_at). Null positions go last.
    const combined: Array<Sibling & { position: number | null; created_at: string }> = [
      ...foldersData.map((f) => ({ id: f.id as string, kind: 'folder' as const, position: (f.position as number | null) ?? null, created_at: f.created_at as string })),
      ...filesData.map((f) => ({ id: f.id as string, kind: 'file' as const, position: (f.position as number | null) ?? null, created_at: f.created_at as string })),
      ...sectionsData.map((s) => ({ id: s.id as string, kind: 'section' as const, position: (s.position as number | null) ?? null, created_at: s.created_at as string })),
    ];

    combined.sort((a, b) => {
      const pa = a.position ?? Number.MAX_SAFE_INTEGER;
      const pb = b.position ?? Number.MAX_SAFE_INTEGER;
      if (pa !== pb) return pa - pb;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return combined.map((c) => ({ id: c.id, kind: c.kind }));
  };

  /** Persist the new linear order (1..N) for the given siblings. */
  const writeSiblingOrder = async (siblings: Sibling[]) => {
    await Promise.all(
      siblings.map((s, idx) => {
        const newPos = idx + 1;
        if (s.kind === 'folder') return supabase.from('folders').update({ position: newPos }).eq('id', s.id);
        if (s.kind === 'file') return supabase.from('files').update({ position: newPos }).eq('id', s.id);
        return supabase.from('space_sections').update({ position: newPos }).eq('id', s.id);
      })
    );
  };

  const reorderItemsInSpace = useCallback(
    async (
      spaceId: string,
      folderId: string | null,
      activeId: string,
      overId: string
    ) => {
      if (!activeId || !overId || activeId === overId) return;

      const siblings = await fetchSiblingsAtLevel(spaceId, folderId);
      const fromIdx = siblings.findIndex((s) => s.id === activeId);
      const toIdx = siblings.findIndex((s) => s.id === overId);
      if (fromIdx < 0 || toIdx < 0) {
        console.warn('[reorder] active/over item not found at this level');
        return;
      }

      // Move activeId so it lands at overId's slot (everything else shifts)
      const next = siblings.slice();
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);

      // Optimistic: update local cache so the UI doesn't flash
      try {
        await writeSiblingOrder(next);
        await refreshSpace(spaceId);
      } catch (err) {
        console.error('[reorder] failed:', err);
      }
    },
    [refreshSpace]
  );

  const moveItemInSpace = useCallback(
    async (
      spaceId: string,
      itemId: string,
      parentId: string | null,
      direction: 'up' | 'down'
    ) => {
      const siblings = await fetchSiblingsAtLevel(spaceId, parentId);
      const idx = siblings.findIndex((s) => s.id === itemId);
      if (idx < 0) return;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= siblings.length) return;
      const next = siblings.slice();
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      try {
        await writeSiblingOrder(next);
        await refreshSpace(spaceId);
      } catch (err) {
        console.error('[move] failed:', err);
      }
    },
    [refreshSpace]
  );

  // Insert a section header at the given level, placed relative to an anchor
  // item (above/below) or appended at the end, then renumber the level 1..N.
  const addSectionHeaderToSpace = useCallback(
    async (
      spaceId: string,
      name: string,
      parentId: string | null,
      position: 'end' | 'above' | 'below' = 'end',
      anchorId?: string
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const ownerId = (await getEffectiveOwnerId()) ?? user.id;
      const level = parentId === 'root' ? null : (parentId ?? null);

      // Snapshot siblings BEFORE insert so we can compute placement.
      const siblings = await fetchSiblingsAtLevel(spaceId, level);

      const id = crypto.randomUUID();
      const { error } = await supabase.from('space_sections').insert({
        id,
        user_id: ownerId,
        space_id: spaceId,
        parent_id: level,
        name,
      });
      if (error) {
        console.error('Error adding section header:', error);
        throw error;
      }

      const newItem = { id, kind: 'section' as const };
      let next: Sibling[];
      if (position === 'end' || !anchorId) {
        next = [...siblings, newItem];
      } else {
        const anchorIdx = siblings.findIndex((s) => s.id === anchorId);
        const insertIdx = anchorIdx < 0 ? siblings.length : position === 'above' ? anchorIdx : anchorIdx + 1;
        next = siblings.slice();
        next.splice(insertIdx, 0, newItem);
      }
      await writeSiblingOrder(next);
      await refreshSpace(spaceId);
    },
    [refreshSpace]
  );

  const contextValue = useMemo(() => ({
    spaces,
    refreshSpace, // ✅ exported
    addSpace,
    findSpace,
    updateSpace,
    deleteSpace,
    addFilesToSpace,
    addFolderToSpace,
    renameItemInSpace,
    deleteItemFromSpace,
    addLinkToSpace,
    // Stubs - present so callers don't crash; replace with real impls later.
    reorderItemsInSpace,
    addSectionHeaderToSpace,
    moveItemInSpace,
  }), [
    spaces, refreshSpace, addSpace, findSpace, updateSpace, deleteSpace,
    addFilesToSpace, addFolderToSpace, renameItemInSpace, deleteItemFromSpace, addLinkToSpace,
    reorderItemsInSpace, addSectionHeaderToSpace, moveItemInSpace,
  ]);

  return (
    <SpacesContext.Provider value={contextValue}>
      {children}
    </SpacesContext.Provider>
  );
};

export const useSpaces = () => {
  const context = useContext(SpacesContext);
  if (context === undefined) {
    throw new Error('useSpaces must be used within a SpacesProvider');
  }
  return context;
};