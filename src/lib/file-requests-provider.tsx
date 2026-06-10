'use client';

import { useState, createContext, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';

export type FileRequest = {
  id: string;
  title: string;
  uploadLocation: { id: string; name: string; type: 'folder' | 'space' };
  uploaders: number;
  files: number;
  ownerAvatar: string;
  link: string;
  message: string;
  expiresAt?: Date | string;
  isEnabled: boolean;
};

type AddFileRequestInput =
  Omit<FileRequest, 'id' | 'link' | 'uploaders' | 'files' | 'ownerAvatar' | 'isEnabled'>
  & {
    /** Optional: caller-provided link (e.g. from a DB-generated token) so the
     *  local link and the DB link stay in sync. */
    link?: string;
  };

type FileRequestContextType = {
  fileRequests: FileRequest[];
  setFileRequests: React.Dispatch<React.SetStateAction<FileRequest[]>>;
  addFileRequest: (newRequest: AddFileRequestInput) => FileRequest | null;
  updateFileRequest: (updatedRequest: Partial<FileRequest> & { id: string }) => void;
};

const FileRequestContext = createContext<FileRequestContextType | undefined>(undefined);

// Legacy browser-global key. It was shared across every account on the same
// browser, which leaked one user's file requests into another's view. We now
// load from Supabase scoped to the logged-in user; this key is purged on mount.
const LEGACY_LOCAL_STORAGE_KEY = 'secureShareFileRequests';

export const FileRequestProvider = ({ children }: { children: ReactNode }) => {
  const [fileRequests, setFileRequests] = useState<FileRequest[]>([]);

  // ── Load THIS user's file requests from Supabase (scoped by created_by) ──
  // SECURITY: file requests are per-user. We never read a browser-global cache,
  // so a different account on the same browser can never see someone else's.
  useEffect(() => {
    // One-time cleanup of the old browser-global cache so stale data can't show.
    try { window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY); } catch { /* SSR */ }

    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) setFileRequests([]); return; }

      const { data, error } = await supabase
        .from('file_requests')
        .select('id, token, title, message, target_folder_id, target_folder_name, target_type, target_space_id, expires_at, is_active')
        .eq('created_by', user.id);

      if (cancelled) return;
      if (error || !data) { setFileRequests([]); return; }

      setFileRequests(
        data.map((row: any): FileRequest => ({
          id: row.id ? String(row.id) : `req_${row.token}`,
          title: row.title ?? 'Untitled request',
          message: row.message ?? '',
          uploadLocation: {
            id: row.target_folder_id ?? row.target_space_id ?? '',
            name: row.target_folder_name ?? '',
            type: row.target_type === 'space' ? 'space' : 'folder',
          },
          uploaders: 0, // real counts merged in by the counts poll on the page
          files: 0,
          ownerAvatar: 'user-avatar',
          link: `/request/${row.token}`,
          isEnabled: row.is_active ?? true,
          expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
        })),
      );
    })();

    return () => { cancelled = true; };
  }, []);

  const addFileRequest = useCallback((requestData: AddFileRequestInput) => {
    const newRequestId = `req_${Date.now()}`;

    // Prefer the caller-provided link (from the DB token) so the link the user
    // copies matches the row inserted into Supabase.
    let newRequestLink = requestData.link;
    if (!newRequestLink) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const arr = (typeof crypto !== 'undefined' && crypto.getRandomValues)
        ? crypto.getRandomValues(new Uint8Array(20))
        : new Uint8Array(Array.from({ length: 20 }, () => Math.floor(Math.random() * 256)));
      const token = Array.from(arr, (b) => chars[b % chars.length]).join('');
      newRequestLink = `/request/${token}`;
    }

    const newRequest: FileRequest = {
      ...requestData,
      id: newRequestId,
      link: newRequestLink,
      uploaders: 0,
      files: 0,
      ownerAvatar: 'user-avatar',
      isEnabled: true,
      expiresAt: requestData.expiresAt ? new Date(requestData.expiresAt) : undefined,
    };

    setFileRequests(prev => [newRequest, ...prev]);
    return newRequest;
  }, []);

  const updateFileRequest = useCallback((updatedRequest: Partial<FileRequest> & { id: string }) => {
    setFileRequests(prev =>
      prev.map(req => (req.id === updatedRequest.id ? { ...req, ...updatedRequest } : req)),
    );
  }, []);

  const contextValue = useMemo(() => ({
    fileRequests,
    setFileRequests,
    addFileRequest,
    updateFileRequest,
  }), [fileRequests, addFileRequest, updateFileRequest]);

  return (
    <FileRequestContext.Provider value={contextValue}>
      {children}
    </FileRequestContext.Provider>
  );
};

export const useFileRequests = () => {
  const context = useContext(FileRequestContext);
  if (context === undefined) {
    throw new Error('useFileRequests must be used within a FileRequestProvider');
  }
  return context;
};
