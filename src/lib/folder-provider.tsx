'use client';

import {
  useState,
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
  startTransition,
  useRef,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getEffectiveOwnerId } from '@/lib/workspace';
import type { PlacedField } from '@/app/(app)/agreements/edit/_components/agreement-editor';
import { type ShareLink } from './documents-provider';

export type Signature = {
  name?: string;
  email?: string;
  dateSigned: string;
  signedFrom: string;
  account: string;
  fieldValues?: Record<string, string | { type: 'typed' | 'drawn'; value: string }>;
};

export type Visit = {
  id: string;
  name: string;
  email: string;
  account: string;
  isInternal: boolean;
  time: string;
  link: string;
  duration: string;
  durationSeconds: number;
  device: string;
  os: string;
  location: string;
  signed: boolean;
  viewPercentage: number;
  pageViews: Record<string, number>;
};

export type File = {
  id: string;
  name: string;
  type: 'PDF' | 'Deck' | 'Sheet' | 'Doc' | 'Image';
  createdAt: string;
  views: number;
  storagePath: string;
  contentUrl?: string;
  size?: number;
  agreementFields?: PlacedField[];
  links?: ShareLink[];
  signatures?: Signature[];
  visits?: Visit[];
  /** Owner-controlled visibility. When false, visitors don't see this file
   *  at all (filtered out by the visitor-view query). Defaults to true. */
  isVisible?: boolean;
};

export type Folder = {
  id: string;
  name: string;
  type: 'personal' | 'team';
  children: Folder[];
  files: File[];
  /** Owner-controlled visibility. When false, the folder + everything inside
   *  it is hidden from the visitor view. Defaults to true. */
  isVisible?: boolean;
};

export type DeletedItem = {
  id: string;
  itemId: string;
  name: string;
  itemType: 'folder' | 'file';
  deletedAt: Date;
};

type FoldersContextType = {
  folders: Folder[];
  documents: File[];
  isLoading: boolean;
  deletedItems: DeletedItem[];
  findDocument: (id: string) => File | undefined;
  updateFile: (fileId: string, updates: Partial<File>) => void;
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  findFolder: (id: string, folderList?: Folder[]) => Folder | null;
  addFolder: (parentId: string | null, newFolder: Folder) => Promise<void>;
  renameFolder: (folderId: string, newName: string) => void;
  deleteFolder: (folderId: string) => Promise<string | null>;
  addFilesToFolder: (folderId: string, newFiles: File[]) => Promise<void>;
  deleteFile: (folderId: string, fileId: string) => void;
  addLinkToFile: (fileId: string, link: ShareLink) => void;
  /** Find-or-create the user's Agreements folder. Returns the UUID,
   *  or null if the user isn't authenticated / CL space isn't ready. */
  ensureAgreementsFolder: () => Promise<string | null>;
};

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

function getAllFilesFromTree(folderList: Folder[]): File[] {
  let files: File[] = [];
  for (const folder of folderList) {
    files.push(...folder.files);
    if (folder.children?.length) files.push(...getAllFilesFromTree(folder.children));
  }
  return files;
}

function dbRowToFile(row: Record<string, unknown>, contentUrl?: string): File {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as File['type'],
    createdAt: row.created_at as string,
    views: (row.views as number) ?? 0,
    storagePath: (row.storage_path as string) ?? '',
    contentUrl,
    agreementFields: (row.agreement_fields as PlacedField[]) ?? [],
    links: (row.links as ShareLink[]) ?? [],
    signatures: (row.signatures as Signature[]) ?? [],
    visits: (row.visits as Visit[]) ?? [],
  };
}

type FlatFolder = { id: string; name: string; parent_id: string | null; space_id: string | null; type?: string | null };

function buildFolderTree(
  flatFolders: FlatFolder[],
  filesByFolderId: Record<string, File[]>
): Folder[] {
  const map: Record<string, Folder> = {};
  for (const f of flatFolders) {
    map[f.id] = {
      id: f.id,
      name: f.name,
      type: f.type === 'team' ? 'team' : 'personal',
      children: [],
      files: filesByFolderId[f.id] ?? [],
    };
  }
  const roots: Folder[] = [];
  for (const f of flatFolders) {
    if (f.parent_id === null) {
      roots.push(map[f.id]);
    } else if (map[f.parent_id]) {
      map[f.parent_id].children.push(map[f.id]);
    }
  }
  return roots;
}

// Pure recursive helpers - defined outside the component so they are stable
// references and never contribute to useCallback dependency arrays.

function searchFolderTree(id: string, list: Folder[]): Folder | null {
  for (const folder of list) {
    if (folder.id === id) return folder;
    if (folder.children?.length) {
      const found = searchFolderTree(id, folder.children);
      if (found) return found;
    }
  }
  return null;
}

function addFolderRecursive(list: Folder[], parentId: string, newFolder: Folder): Folder[] {
  return list.map(f => {
    if (f.id === parentId) return { ...f, children: [...f.children, newFolder] };
    if (f.children.length) return { ...f, children: addFolderRecursive(f.children, parentId, newFolder) };
    return f;
  });
}

function renameFolderRecursive(list: Folder[], folderId: string, newName: string): Folder[] {
  return list.map(f => {
    if (f.id === folderId) return { ...f, name: newName };
    if (f.children.length) return { ...f, children: renameFolderRecursive(f.children, folderId, newName) };
    return f;
  });
}

function deleteFolderRecursive(list: Folder[], folderId: string): Folder[] {
  return list
    .filter(f => f.id !== folderId)
    .map(f => ({ ...f, children: deleteFolderRecursive(f.children, folderId) }));
}

function addFilesRecursive(list: Folder[], folderId: string, newFiles: File[]): Folder[] {
  return list.map(f => {
    if (f.id === folderId) return { ...f, files: [...(f.files ?? []), ...newFiles] };
    if (f.children?.length) return { ...f, children: addFilesRecursive(f.children, folderId, newFiles) };
    return f;
  });
}

function deleteFileRecursive(list: Folder[], folderId: string, fileId: string): Folder[] {
  return list.map(f => {
    if (f.id === folderId) return { ...f, files: f.files.filter(file => file.id !== fileId) };
    if (f.children.length) return { ...f, children: deleteFileRecursive(f.children, folderId, fileId) };
    return f;
  });
}

function updateFileRecursive(list: Folder[], fileId: string, updates: Partial<File>): Folder[] {
  return list.map(f => {
    const idx = f.files.findIndex(file => file.id === fileId);
    if (idx !== -1) {
      const newFiles = [...f.files];
      newFiles[idx] = { ...newFiles[idx], ...updates };
      return { ...f, files: newFiles };
    }
    if (f.children?.length) return { ...f, children: updateFileRecursive(f.children, fileId, updates) };
    return f;
  });
}

export const FoldersProvider = ({ children }: { children: ReactNode }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const deleteQueueRef = useRef<Set<string>>(new Set());

  // Always holds the latest folders snapshot - lets deleteFolder stay stable
  // (no `folders` dep) while still being able to revert on DB error.
  const foldersRef = useRef<Folder[]>([]);

  // The single sentinel Supabase space that owns all Content Library folders.
  // Keeping it in a ref (not state) means it never triggers re-renders.
  const clSpaceIdRef = useRef<string | null>(null);

  // Keep foldersRef in sync with state after every render.
  useEffect(() => {
    foldersRef.current = folders;
  }, [folders]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Scope the whole Content Library to the effective workspace owner. For
      // an invited collaborator this resolves to the inviter's id, so they load
      // the SAME (shared) Content Library; setUserId(ownerId) then makes every
      // downstream folder/file mutation operate on that shared workspace too.
      const ownerId = await getEffectiveOwnerId();
      if (!ownerId) { setIsLoading(false); return; }
      setUserId(ownerId);

      // ── Find or create the Content Library sentinel space ──────────────────
      // All CL folders are scoped to this one space so that folders from
      // user-created Spaces never bleed into the Content Library view.
      let clSpaceId: string;

      const { data: existingCLSpace } = await supabase
        .from('spaces')
        .select('id')
        .eq('created_by', ownerId)
        .eq('title', 'CONTENT_LIBRARY')
        .maybeSingle();

      if (existingCLSpace?.id) {
        clSpaceId = existingCLSpace.id as string;
      } else {
        const { data: newCLSpace, error: clErr } = await supabase
          .from('spaces')
          .insert({ name: 'Content Library', title: 'CONTENT_LIBRARY', created_by: ownerId })
          .select('id')
          .single();
        if (clErr || !newCLSpace) {
          console.error('Failed to create CL space:', clErr);
          setIsLoading(false);
          return;
        }
        clSpaceId = newCLSpace.id as string;
      }

      clSpaceIdRef.current = clSpaceId;

      // ── Load only folders that belong to the CL sentinel space ────────────
      // Try to select `type` column; if it doesn't exist in the DB yet, fall back
      // to a query without it (all folders default to 'personal' in that case).
      let { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('id, name, parent_id, space_id, type')
        .eq('user_id', ownerId)
        .eq('space_id', clSpaceId)
        .order('created_at', { ascending: true });

      if (foldersError) {
        // Retry without `type` - handles the case where the column doesn't exist yet.
        const fallback = await supabase
          .from('folders')
          .select('id, name, parent_id, space_id')
          .eq('user_id', ownerId)
          .eq('space_id', clSpaceId)
          .order('created_at', { ascending: true });
        if (fallback.error) {
          console.error('Error loading folders:', fallback.error);
          setIsLoading(false);
          return;
        }
        foldersData = (fallback.data ?? []).map(f => ({ ...f, type: null })) as typeof foldersData;
        foldersError = null;
      }

      if (!foldersData || foldersData.length === 0) {
        // No folders exist - show the empty state so the user creates their own.
        setIsLoading(false);
        return;
      }

      // ── Load only files that belong to CL folders ─────────────────────────
      const clFolderIds = foldersData.map(f => f.id);

      const { data: filesData } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', ownerId)
        .in('folder_id', clFolderIds)
        .order('created_at', { ascending: false });

      const allFiles = filesData ?? [];

      const storagePaths = allFiles.map(r => r.storage_path as string).filter(Boolean);
      const signedUrlMap: Record<string, string> = {};
      if (storagePaths.length > 0) {
        const { data: signedData } = await supabase.storage
          .from('documents')
          .createSignedUrls(storagePaths, 604800);
        if (signedData) {
          for (const item of signedData) {
            if (item.signedUrl && item.path) signedUrlMap[item.path] = item.signedUrl;
          }
        }
      }

      const filesByFolderId: Record<string, File[]> = {};
      for (const row of allFiles) {
        const folderId = row.folder_id as string;
        if (!filesByFolderId[folderId]) filesByFolderId[folderId] = [];
        const contentUrl = signedUrlMap[row.storage_path as string];
        filesByFolderId[folderId].push(dbRowToFile(row as Record<string, unknown>, contentUrl));
      }

      startTransition(() => {
        setFolders(buildFolderTree(foldersData as FlatFolder[], filesByFolderId));
      });

      // ── Load persistent deleted items (CL space only) ─────────────────────
      // Gracefully degrade if the `deleted_items` table doesn't exist yet.
      try {
        const { data: deletedData, error: deletedError } = await supabase
          .from('deleted_items')
          .select('id, item_id, item_name, item_type, deleted_at')
          .eq('user_id', ownerId)
          .eq('space_id', clSpaceId)
          .order('deleted_at', { ascending: false });

        if (!deletedError && deletedData) {
          setDeletedItems(deletedData.map(d => ({
            id: d.id as string,
            itemId: d.item_id as string,
            name: d.item_name as string,
            itemType: (d.item_type === 'file' ? 'file' : 'folder') as 'folder' | 'file',
            deletedAt: new Date(d.deleted_at as string),
          })));
        }
      } catch (err) {
        console.warn('[deleted_items] table may not exist yet - using session-only tracking. Run the SQL provided to enable persistence.');
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Helper: log a deletion to both local state (instant) and DB (background).
  // Gracefully degrades if the deleted_items table doesn't exist.
  const logDeletion = useCallback((
    itemId: string,
    name: string,
    itemType: 'folder' | 'file'
  ) => {
    const tempId = `temp_del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: DeletedItem = {
      id: tempId,
      itemId,
      name,
      itemType,
      deletedAt: new Date(),
    };
    setDeletedItems(prev => [optimistic, ...prev]);

    if (userId) {
      const clSpaceId = clSpaceIdRef.current;
      supabase
        .from('deleted_items')
        .insert({
          user_id: userId,
          item_id: itemId,
          item_name: name,
          item_type: itemType,
          space_id: clSpaceId,
          deleted_at: optimistic.deletedAt.toISOString(),
        })
        .select('id')
        .then(({ data, error }) => {
          if (error) {
            // Table doesn't exist or insert failed - keep the optimistic entry
            // for the session but warn so the user knows to add the table.
            console.warn('[deleted_items] insert failed - record kept in memory only:', error.message);
          } else if (data && data[0]?.id) {
            // Replace temp id with real DB id
            setDeletedItems(prev => prev.map(d =>
              d.id === tempId ? { ...d, id: data[0].id as string } : d
            ));
          }
        });
    }
  }, [userId]);

  // Stable - no dependency on `folders`. Uses foldersRef.current as the
  // default list so callers that omit the second arg still get fresh data,
  // while all current call-sites pass an explicit list anyway.
  const findFolder = useCallback(
    (id: string, folderList?: Folder[]): Folder | null =>
      searchFolderTree(id, folderList ?? foldersRef.current),
    [] // intentionally empty - searchFolderTree is a module-level pure function
  );

  const addFolder = useCallback(
    async (parentId: string | null, newFolder: Folder): Promise<void> => {
      if (!userId) return;

      let spaceId: string;

      if (parentId === null) {
        // Use the CL sentinel space. Never create additional spaces for top-level
        // CL folders - doing so was what caused those folders to appear in the
        // Spaces sidebar list.
        const clId = clSpaceIdRef.current;
        if (!clId) throw new Error('Content library space not initialized');
        spaceId = clId;
      } else {
        const { data: parentData, error: parentError } = await supabase
          .from('folders')
          .select('space_id')
          .eq('id', parentId)
          .single();
        if (parentError) { console.error('Error fetching parent folder:', parentError); throw parentError; }
        spaceId = parentData.space_id as string;
      }

      let { error } = await supabase.from('folders').insert({
        id: newFolder.id,
        user_id: userId,
        name: newFolder.name,
        parent_id: parentId,
        space_id: spaceId,
        type: newFolder.type ?? 'personal',
      });
      // If insert failed because `type` column doesn't exist, retry without it.
      if (error) {
        const retry = await supabase.from('folders').insert({
          id: newFolder.id,
          user_id: userId,
          name: newFolder.name,
          parent_id: parentId,
          space_id: spaceId,
        });
        if (retry.error) { console.error('Error adding folder:', retry.error); throw retry.error; }
      }

      startTransition(() => {
        setFolders(prev => {
          if (parentId === null) return [...prev, newFolder];
          return addFolderRecursive(prev, parentId, newFolder);
        });
      });
    },
    [userId]
  );

  const renameFolder = useCallback(
    (folderId: string, newName: string) => {
      startTransition(() => {
        setFolders(prev => renameFolderRecursive(prev, folderId, newName));
      });
      if (userId) {
        supabase.from('folders').update({ name: newName })
          .eq('id', folderId).eq('user_id', userId)
          .then(({ error }) => { if (error) console.error('Error renaming folder:', error); });
      }
    },
    [userId]
  );

  // Fire-and-forget delete: the UI updates instantly (optimistic), and the DB
  // delete runs in the background. No isDeleting state means no re-render cascade
  // and no UI freeze while waiting for the network round-trip.
  const deleteFolder = useCallback(
    (folderId: string): Promise<string | null> => {
      if (deleteQueueRef.current.has(folderId)) return Promise.resolve(null);
      deleteQueueRef.current.add(folderId);

      const deletedName = searchFolderTree(folderId, foldersRef.current)?.name ?? null;
      const snapshot = foldersRef.current;

      // Log to deleted_items (persistent) - happens before the destructive DB op
      // so we never lose the record even if the main delete fails.
      if (deletedName) logDeletion(folderId, deletedName, 'folder');

      // Remove from UI immediately - no loading state, no blocked interactions.
      startTransition(() => {
        setFolders(prev => deleteFolderRecursive(prev, folderId));
      });

      if (userId) {
        supabase
          .from('folders')
          .delete()
          .eq('id', folderId)
          .eq('user_id', userId)
          .then(({ error }) => {
            deleteQueueRef.current.delete(folderId);
            if (error) {
              console.error('Error deleting folder from DB - reverting:', error);
              startTransition(() => setFolders(snapshot));
            }
          });
      } else {
        deleteQueueRef.current.delete(folderId);
      }

      return Promise.resolve(deletedName);
    },
    [userId, logDeletion]
  );

  const addFilesToFolder = useCallback(
    async (folderId: string, newFiles: File[]): Promise<void> => {
      if (!userId) return;

      // Persist the file to a REAL folder row. A real folder id is either a
      // UUID (older folders) or the `folder_<timestamp>` id the UI generates
      // (current folders) - both have a row in `folders` and MUST be written.
      // Only synthetic sentinel ids (e.g. 'personal-root', used by the
      // Agreements flow) have no folders row; those skip the DB write and rely
      // on the in-memory tree update below.
      //
      // BUG FIX: this previously matched UUID only, which rejected every real
      // content-library folder (they use folder_<timestamp> ids). As a result
      // uploads were never saved to the DB and disappeared on refresh.
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isPersistedFolder = UUID_RE.test(folderId) || /^folder_\d+/.test(folderId);

      if (isPersistedFolder) {
        const inserts = newFiles.map(f => ({
          id: f.id,
          user_id: userId,
          folder_id: folderId,
          name: f.name,
          type: f.type,
          created_at: f.createdAt,
          views: f.views ?? 0,
          storage_path: f.storagePath,
          size_bytes: f.size ?? 0,
          agreement_fields: f.agreementFields ?? [],
          links: f.links ?? [],
          signatures: f.signatures ?? [],
          visits: f.visits ?? [],
        }));
        const { error } = await supabase.from('files').insert(inserts);
        if (error) {
          // Supabase errors don't always log usefully - pull out the
          // fields explicitly so the developer sees what actually went
          // wrong (was just showing `{}` before).
          console.error('Error adding files:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          throw error;
        }
      }

      startTransition(() => {
        setFolders(prev => {
          // For synthetic sentinel folder ids (e.g. 'personal-root'),
          // there's no matching folder row in the in-memory tree -
          // `addFilesRecursive` would silently drop the files. Lazily
          // create the synthetic folder so the file is reachable via
          // `documents` / `findDocument`. This is what makes the
          // Agreements upload → edit flow work.
          const hasFolder = (list: Folder[]): boolean =>
            list.some(f => f.id === folderId || (f.children?.length ? hasFolder(f.children) : false));
          const next = !isPersistedFolder && !hasFolder(prev)
            ? [...prev, {
                id: folderId,
                name: 'Agreements',
                type: 'personal' as const,
                children: [],
                files: [],
              }]
            : prev;
          return addFilesRecursive(next, folderId, newFiles);
        });
      });
    },
    [userId]
  );

  /**
   * Find-or-create the user's "Agreements" folder inside the Content
   * Library sentinel space. Returns the folder UUID. Used by the
   * Agreements upload flow so uploaded PDFs persist as real DB rows
   * (visible across tabs, refreshes, and to share-link visitors).
   *
   * Idempotent: subsequent calls reuse the existing folder.
   */
  const ensureAgreementsFolder = useCallback(async (): Promise<string | null> => {
    if (!userId) return null;
    const clSpaceId = clSpaceIdRef.current;
    if (!clSpaceId) return null;

    // 1. Existing in-memory tree
    const inMemory = folders.find(f => f.name === 'Agreements' && f.type === 'personal');
    if (inMemory) return inMemory.id;

    // 2. Existing in DB (page may have just loaded - re-query)
    const { data: existing } = await supabase
      .from('folders')
      .select('id')
      .eq('user_id', userId)
      .eq('space_id', clSpaceId)
      .eq('name', 'Agreements')
      .is('parent_id', null)
      .maybeSingle();
    if (existing?.id) {
      const newFolder: Folder = {
        id: existing.id as string,
        name: 'Agreements',
        type: 'personal',
        children: [],
        files: [],
      };
      startTransition(() => setFolders(prev => [...prev, newFolder]));
      return existing.id as string;
    }

    // 3. Create it
    const newId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `agr-${Date.now()}`;
    const { error: createErr } = await supabase
      .from('folders')
      .insert({ id: newId, user_id: userId, name: 'Agreements', space_id: clSpaceId, parent_id: null });
    if (createErr) {
      console.error('Failed to create Agreements folder:', createErr);
      return null;
    }
    const newFolder: Folder = {
      id: newId, name: 'Agreements', type: 'personal',
      children: [], files: [],
    };
    startTransition(() => setFolders(prev => [...prev, newFolder]));
    return newId;
  }, [userId, folders]);

  const deleteFile = useCallback(
    (folderId: string, fileId: string) => {
      // Find file name before removing from state, so we can log it.
      const targetFolder = searchFolderTree(folderId, foldersRef.current);
      const targetFile = targetFolder?.files.find(f => f.id === fileId);
      const fileName = targetFile?.name ?? null;

      if (fileName) logDeletion(fileId, fileName, 'file');

      startTransition(() => {
        setFolders(prev => deleteFileRecursive(prev, folderId, fileId));
      });
      if (userId) {
        supabase.from('files').delete()
          .eq('id', fileId).eq('user_id', userId)
          .then(({ error }) => { if (error) console.error('Error deleting file:', error); });
      }
    },
    [userId, logDeletion]
  );

  const documents = useMemo(() => getAllFilesFromTree(folders), [folders]);

  const findDocument = useCallback(
    (id: string): File | undefined => documents.find(doc => doc.id === id),
    [documents]
  );

  const updateFile = useCallback(
    (fileId: string, updates: Partial<File>) => {
      startTransition(() => {
        setFolders(prev => updateFileRecursive(prev, fileId, updates));
      });
      if (userId) {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.views !== undefined) dbUpdates.views = updates.views;
        if (updates.links !== undefined) dbUpdates.links = updates.links;
        if (updates.signatures !== undefined) dbUpdates.signatures = updates.signatures;
        if (updates.visits !== undefined) dbUpdates.visits = updates.visits;
        if (updates.agreementFields !== undefined) dbUpdates.agreement_fields = updates.agreementFields;
        if (Object.keys(dbUpdates).length > 0) {
          supabase.from('files').update(dbUpdates)
            .eq('id', fileId).eq('user_id', userId)
            .then(({ error }) => { if (error) console.error('Error updating file:', error); });
        }
      }
    },
    [userId]
  );

  const addLinkToFile = useCallback(
    (fileId: string, link: ShareLink) => {
      updateFile(fileId, { links: [...(findDocument(fileId)?.links ?? []), link] });
    },
    [findDocument, updateFile]
  );

  const contextValue = useMemo(
    () => ({
      folders, documents, isLoading, deletedItems, findDocument, updateFile,
      setFolders, findFolder, addFolder, renameFolder, deleteFolder,
      addFilesToFolder, deleteFile, addLinkToFile, ensureAgreementsFolder,
    }),
    [folders, documents, isLoading, deletedItems, findDocument, updateFile, setFolders,
     findFolder, addFolder, renameFolder, deleteFolder, addFilesToFolder,
     deleteFile, addLinkToFile, ensureAgreementsFolder]
  );

  return <FoldersContext.Provider value={contextValue}>{children}</FoldersContext.Provider>;
};

export const useFolders = () => {
  const context = useContext(FoldersContext);
  if (context === undefined) throw new Error('useFolders must be used within a FoldersProvider');
  return context;
};
