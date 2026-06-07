/**
 * Shared file-type → icon + colour mapping.
 *
 * Used by:
 *   - Content Library detail page (big tinted square in the title block,
 *     small colour-only icons in the file list)
 *   - Space analytics (file rows inside session drilldowns)
 *   - Anywhere else we want a file icon that visually conveys the type
 *
 * Lives in /lib so any component (server or client) can import it. The
 * returned classes are full Tailwind strings (not interpolated) so the
 * JIT compiler can see them at build time - add new file types by
 * extending this file with fresh literal strings, not by composing them.
 */

import {
  File as FileIcon,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileSignature,
} from 'lucide-react';

export type FileTypeStyle = {
  Icon: typeof FileIcon;
  /** Tailwind bg class - e.g. "bg-red-50". Use on the tinted square. */
  bg: string;
  /** Tailwind text class - e.g. "text-red-600". Use on the icon itself. */
  text: string;
};

export function getFileTypeStyle(filename: string, isAgreement = false): FileTypeStyle {
  if (isAgreement) {
    return { Icon: FileSignature, bg: 'bg-purple-50', text: 'text-purple-600' };
  }
  const ext = (filename.toLowerCase().split('.').pop() ?? '').trim();

  if (ext === 'pdf') {
    return { Icon: FileText, bg: 'bg-red-50', text: 'text-red-600' };
  }
  if (['doc', 'docx', 'txt', 'rtf', 'md'].includes(ext)) {
    return { Icon: FileText, bg: 'bg-blue-50', text: 'text-blue-600' };
  }
  if (['xls', 'xlsx', 'csv', 'numbers'].includes(ext)) {
    return { Icon: FileSpreadsheet, bg: 'bg-green-50', text: 'text-green-600' };
  }
  if (['ppt', 'pptx', 'key'].includes(ext)) {
    return { Icon: FileText, bg: 'bg-orange-50', text: 'text-orange-600' };
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'heic'].includes(ext)) {
    return { Icon: FileImage, bg: 'bg-pink-50', text: 'text-pink-600' };
  }
  if (['mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v'].includes(ext)) {
    return { Icon: FileVideo, bg: 'bg-indigo-50', text: 'text-indigo-600' };
  }
  return { Icon: FileIcon, bg: 'bg-gray-100', text: 'text-gray-600' };
}
