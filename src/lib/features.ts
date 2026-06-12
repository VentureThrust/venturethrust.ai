import {
  Link2,
  Lock,
  KeyRound,
  CalendarClock,
  ListChecks,
  Droplets,
  BarChart3,
  Radio,
  Users,
  Clock,
  Download,
  History,
  Boxes,
  FolderOpen,
  FileSignature,
  PenLine,
  Inbox,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export type FeatureItem = { icon: LucideIcon; title: string; desc: string; href: string };
export type FeatureGroup = { heading: string; items: FeatureItem[] };

/** The full feature list, grouped. Shared by the nav mega menu and /features. */
export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    heading: 'Share & control',
    items: [
      { icon: Link2, title: 'Secure share links', desc: 'One link, you control access.', href: '/#features' },
      { icon: Lock, title: 'Access gates', desc: 'Require an email to view.', href: '/#features' },
      { icon: KeyRound, title: 'Password protection', desc: 'Add a passcode to any link.', href: '/#features' },
      { icon: CalendarClock, title: 'Expiry & revoke', desc: 'Cut off access any time.', href: '/#features' },
      { icon: ListChecks, title: 'Allow / block lists', desc: 'Restrict to specific people.', href: '/#features' },
      { icon: Droplets, title: 'Dynamic watermarks', desc: 'Stamp each page per viewer.', href: '/#security' },
    ],
  },
  {
    heading: 'Track & analyze',
    items: [
      { icon: BarChart3, title: 'Page-level analytics', desc: 'Time spent on every page.', href: '/#how-it-works' },
      { icon: Radio, title: 'Live viewers', desc: 'See who is inside right now.', href: '/#how-it-works' },
      { icon: Users, title: 'Visitor breakdown', desc: 'Per-person read history.', href: '/#how-it-works' },
      { icon: Clock, title: 'Time per page', desc: 'Find where attention goes.', href: '/#how-it-works' },
      { icon: Download, title: 'Download tracking', desc: 'Know what was taken.', href: '/#how-it-works' },
      { icon: History, title: 'Audit log', desc: 'A full record of activity.', href: '/#security' },
    ],
  },
  {
    heading: 'Documents & deals',
    items: [
      { icon: Boxes, title: 'Data rooms', desc: 'Organize and share a room.', href: '/#features' },
      { icon: FolderOpen, title: 'Content library', desc: 'A reusable file library.', href: '/#features' },
      { icon: FileSignature, title: 'NDA gates', desc: 'Require an NDA to enter.', href: '/#security' },
      { icon: PenLine, title: 'E-signatures', desc: 'Sign before viewing.', href: '/#security' },
      { icon: Inbox, title: 'File requests', desc: 'Collect docs via a link.', href: '/#how-it-works' },
      { icon: MessageSquare, title: 'Q&A', desc: 'Answer questions in-room.', href: '/#how-it-works' },
    ],
  },
];

export type Feature = FeatureItem;
export const FEATURES: Feature[] = FEATURE_GROUPS.flatMap((g) => g.items);
