import {
  Link2,
  Lock,
  KeyRound,
  CalendarClock,
  ListChecks,
  Ban,
  Droplets,
  ShieldCheck,
  BarChart3,
  Radio,
  Users,
  Clock,
  Flame,
  Film,
  Download,
  History,
  Boxes,
  FolderOpen,
  FolderTree,
  LayoutTemplate,
  FileSignature,
  PenLine,
  Inbox,
  MessageSquare,
  UserPlus,
  Building2,
  Share2,
  Bell,
  Palette,
  Globe2,
  Fingerprint,
  MonitorSmartphone,
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
      { icon: Ban, title: 'Block downloads', desc: 'Keep documents view-only.', href: '/#security' },
      { icon: Droplets, title: 'Dynamic watermarks', desc: 'Stamp each page per viewer.', href: '/#security' },
      { icon: ShieldCheck, title: 'Granular permissions', desc: 'Control access per file.', href: '/#security' },
    ],
  },
  {
    heading: 'Track & analyze',
    items: [
      { icon: BarChart3, title: 'Page-level analytics', desc: 'Time spent on every page.', href: '/#how-it-works' },
      { icon: Radio, title: 'Live viewers', desc: 'See who is inside right now.', href: '/#how-it-works' },
      { icon: Users, title: 'Visitor breakdown', desc: 'Per-person read history.', href: '/#how-it-works' },
      { icon: Clock, title: 'Time per page', desc: 'Find where attention goes.', href: '/#how-it-works' },
      { icon: Flame, title: 'PDF page heatmaps', desc: 'See the hottest pages.', href: '/#how-it-works' },
      { icon: Film, title: 'Video analytics', desc: 'Playback heatmaps for video.', href: '/#how-it-works' },
      { icon: Download, title: 'Download tracking', desc: 'Know what was taken.', href: '/#how-it-works' },
      { icon: History, title: 'Audit log', desc: 'A full record of activity.', href: '/#security' },
    ],
  },
  {
    heading: 'Documents & rooms',
    items: [
      { icon: Boxes, title: 'Data rooms', desc: 'Organize and share a room.', href: '/#features' },
      { icon: FolderOpen, title: 'Content library', desc: 'A reusable file library.', href: '/#features' },
      { icon: FolderTree, title: 'Folders & structure', desc: 'Nest and order content.', href: '/#features' },
      { icon: LayoutTemplate, title: 'Data room templates', desc: 'Start from a proven layout.', href: '/#features' },
      { icon: FileSignature, title: 'NDA gates', desc: 'Require an NDA to enter.', href: '/#security' },
      { icon: PenLine, title: 'E-signatures', desc: 'Sign before viewing.', href: '/#security' },
      { icon: Inbox, title: 'File requests', desc: 'Collect docs via a link.', href: '/#how-it-works' },
      { icon: MessageSquare, title: 'Q&A', desc: 'Answer questions in-room.', href: '/#how-it-works' },
    ],
  },
  {
    heading: 'Collaborate & scale',
    items: [
      { icon: UserPlus, title: 'Team collaboration', desc: 'Invite teammates to a workspace.', href: '/#features' },
      { icon: Building2, title: 'Multiple workspaces', desc: 'Switch between teams & deals.', href: '/#features' },
      { icon: Share2, title: 'Shared with you', desc: 'Receive rooms in one inbox.', href: '/#features' },
      { icon: Bell, title: 'Notifications', desc: 'Real-time alerts on activity.', href: '/#how-it-works' },
      { icon: Palette, title: 'Custom branding', desc: 'Your logo and cover image.', href: '/#features' },
      { icon: Globe2, title: 'Custom domain', desc: 'Share on your own domain.', href: '/#features' },
      { icon: Fingerprint, title: 'Single sign-on', desc: 'SSO for your whole team.', href: '/#security' },
      { icon: MonitorSmartphone, title: 'Works on any device', desc: 'Desktop, tablet, and mobile.', href: '/#features' },
    ],
  },
];

export type Feature = FeatureItem;
export const FEATURES: Feature[] = FEATURE_GROUPS.flatMap((g) => g.items);
