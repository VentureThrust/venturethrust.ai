import {
  FileText,
  Presentation,
  FileSpreadsheet,
  FileDigit,
  FileImage,
} from 'lucide-react';
import type { Document } from './documents-provider';

export type { Document };

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
    return 'Doc';
};


export type Viewer = {
  email: string;
  ipAddress: string;
  device: string;
  timeSpent: number;        // total seconds across all files
  pageViews: Record<string, number>;    // fileName → open count
  fileTimeSpent?: Record<string, number>; // fileName → total seconds (NEW)
  repeatVisits: number;
  forwardTracking: boolean;
  lastViewed: string;
};

export const viewers: Viewer[] = [];

export type DataRoom = {
  id: string;
  name: string;
  documentCount: number;
  lastUpdate: string;
};

export const dataRooms: DataRoom[] = [];

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Member';
  avatar: string;
};

export const teamMembers: TeamMember[] = [];

export const chartData = [];