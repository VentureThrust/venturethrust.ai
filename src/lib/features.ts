import {
  Link2,
  Lock,
  BarChart3,
  FileSignature,
  Droplets,
  Inbox,
  History,
  Boxes,
  type LucideIcon,
} from 'lucide-react';

export type Feature = { icon: LucideIcon; title: string; desc: string; href: string };

/** The full feature list, shared by the nav mega menu and the /features page. */
export const FEATURES: Feature[] = [
  { icon: Link2, title: 'Secure share links', desc: 'One link, and you control who gets in.', href: '/#features' },
  { icon: Lock, title: 'Access gates', desc: 'Email, passcode, expiry, allow & block lists.', href: '/#features' },
  { icon: BarChart3, title: 'Page-level analytics', desc: 'See time spent on every page, live.', href: '/#how-it-works' },
  { icon: FileSignature, title: 'NDA & e-signatures', desc: 'Require an NDA or signature before viewing.', href: '/#security' },
  { icon: Droplets, title: 'Dynamic watermarks', desc: "Stamp each page with the viewer's email or IP.", href: '/#security' },
  { icon: Inbox, title: 'File requests & Q&A', desc: 'Collect documents and answer questions in-room.', href: '/#how-it-works' },
  { icon: History, title: 'Audit log', desc: 'A complete record of who saw what, and when.', href: '/#security' },
  { icon: Boxes, title: 'Data rooms', desc: 'Organize a full data room and share it securely.', href: '/#features' },
];
