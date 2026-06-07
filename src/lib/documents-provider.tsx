'use client';

import {
  FileText,
  Presentation,
  FileSpreadsheet,
  FileDigit,
  FileImage,
} from 'lucide-react';
import type { PlacedField } from '@/app/(app)/agreements/edit/_components/agreement-editor';
import React, { createContext, useContext, ReactNode, useState } from 'react';


export type Document = {
  id: string;
  name: string;
  type: 'PDF' | 'Deck' | 'Sheet' | 'Doc' | 'Image';
  createdAt: string;
  views: number;
  storagePath: string;
  contentUrl?: string;
  agreementFields?: PlacedField[];
  links?: ShareLink[];
};

export type ShareLink = {
  id: string;
  account: string;
  requireEmail: boolean;
  allowDownloading: boolean;
  requireNameToSign: boolean;
  expires: boolean;
  expiryDate?: Date;
  passcode: boolean;
  passcodeValue?: string;
  url: string;
  createdAt: string;
  enabled: boolean;
  eSignatures: number;
};

type DocumentsContextType = {
    documents: Document[];
    addDocument: (doc: Document) => void;
    updateDocument: (docId: string, updates: Partial<Document>) => void;
};

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

export const DocumentsProvider = ({ children }: { children: ReactNode }) => {
    const [documents, setDocuments] = useState<Document[]>([]);

    const addDocument = (doc: Document) => {
        setDocuments(prev => [...prev, doc]);
    }

    const updateDocument = (docId: string, updates: Partial<Document>) => {
        setDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, ...updates } : doc));
    }

    return (
        <DocumentsContext.Provider value={{ documents, addDocument, updateDocument }}>
            {children}
        </DocumentsContext.Provider>
    );
}

export const useDocuments = () => {
    const context = useContext(DocumentsContext);
    if (!context) {
        throw new Error('useDocuments must be used within a DocumentsProvider');
    }
    return context;
}


export const getDocumentIcon = (type: Document['type']) => {
  switch (type) {
    case 'PDF':
      return FileText;
    case 'Deck':
      return Presentation;
    case 'Sheet':
      return FileSpreadsheet;
    case 'Doc':
      return FileDigit;
    case 'Image':
      return FileImage;
    default:
      return FileText;
  }
};

export const getFileType = (file: globalThis.File): Document['type'] => {
    if (file.type.startsWith('image/')) {
      return 'Image';
    }
    if (file.type === 'application/pdf') {
      return 'PDF';
    }
    // Add more specific types as needed
    return 'Doc';
};
