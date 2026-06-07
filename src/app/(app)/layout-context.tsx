'use client';

import { createContext, useContext, useState } from 'react';

type Breadcrumb = {
  id: string;
  name: string;
};

/**
 * Pending action posted by the sidebar for the space-edit page to consume.
 * When the user clicks a "+folder" or "+file" hover icon on a sidebar
 * folder row, the sidebar sets this. The space-edit page reads it via
 * useEffect, opens the matching dialog with parent_id = folderId, then
 * clears it.
 */
type PendingAction =
  | { kind: 'create-subfolder'; folderId: string; folderName: string }
  | { kind: 'add-file-to-folder'; folderId: string; folderName: string };

type LayoutContextType = {
  breadcrumbs: Breadcrumb[];
  setBreadcrumbs: (items: Breadcrumb[]) => void;
  fileRequestCount: number;
  setFileRequestCount: (count: number | ((prev: number) => number)) => void;
  pendingAction: PendingAction | null;
  setPendingAction: (a: PendingAction | null) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [fileRequestCount, setFileRequestCount] = useState<number>(0);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  return (
    <LayoutContext.Provider
      value={{
        breadcrumbs,
        setBreadcrumbs,
        fileRequestCount,
        setFileRequestCount,
        pendingAction,
        setPendingAction,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error('useLayout must be used inside LayoutProvider');
  }
  return ctx;
}