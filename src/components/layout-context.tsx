'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Breadcrumb = {
  id: string;
  name: string;
};

type LayoutContextType = {
  fileRequestCount: number;
  setFileRequestCount: (count: number) => void;
  breadcrumbs: Breadcrumb[];
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
  spaceSearchQuery: string;
  setSpaceSearchQuery: (query: string) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [fileRequestCount, setFileRequestCount] = useState(0);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [spaceSearchQuery, setSpaceSearchQuery] = useState('');

  return (
    <LayoutContext.Provider value={{ fileRequestCount, setFileRequestCount, breadcrumbs, setBreadcrumbs, spaceSearchQuery, setSpaceSearchQuery }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
