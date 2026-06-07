
'use client';

import { useState, createContext, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';

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
     *  local-store link and the DB link stay in sync. If omitted, a local token
     *  is generated as a fallback (links won't work cross-browser). */
    link?: string;
  };

type FileRequestContextType = {
  fileRequests: FileRequest[];
  setFileRequests: React.Dispatch<React.SetStateAction<FileRequest[]>>;
  addFileRequest: (newRequest: AddFileRequestInput) => FileRequest | null;
  updateFileRequest: (updatedRequest: Partial<FileRequest> & { id: string }) => void;
};

const FileRequestContext = createContext<FileRequestContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'secureShareFileRequests';

export const FileRequestProvider = ({ children }: { children: ReactNode }) => {
  const [fileRequests, setFileRequests] = useState<FileRequest[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (item) {
        const requests = JSON.parse(item).map((req: FileRequest) => ({
          ...req,
          expiresAt: req.expiresAt ? new Date(req.expiresAt) : undefined,
        }));
        setFileRequests(requests);
      }
    } catch (error) {
      console.error('Error reading file requests from localStorage', error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fileRequests));
      } catch (error) {
        console.error('Error writing file requests to localStorage', error);
      }
    }
  }, [fileRequests, isClient]);

  const addFileRequest = useCallback((requestData: AddFileRequestInput) => {
    const newRequestId = `req_${Date.now()}`;

    // Prefer the caller-provided link (from the DB token) so the link the user
    // copies later matches what was actually inserted into Supabase. Only fall
    // back to a locally-generated token if the DB save didn't return a link.
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
        prev.map(req =>
          req.id === updatedRequest.id
            ? { ...req, ...updatedRequest }
            : req
        )
      );
  }, []);

  const contextValue = useMemo(() => ({
    fileRequests,
    setFileRequests,
    addFileRequest,
    updateFileRequest
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
