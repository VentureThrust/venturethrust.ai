/**
 * Colorful, flat empty-state illustrations - one per page, so an empty screen
 * feels friendly and on-brand instead of a bare black-and-white icon.
 * Pure SVG (self-hosted, no external dependency). Keep the palette cohesive:
 * indigo / amber / emerald / rose accents on soft tinted "ground" ellipses.
 */
import * as React from 'react';

type Props = { className?: string };

const wrap = 'w-full h-auto';

export function SpacesIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 220 180" fill="none" className={className ?? wrap} aria-hidden="true">
      <ellipse cx="110" cy="152" rx="78" ry="11" fill="#eef2ff" />
      <rect x="66" y="50" width="92" height="60" rx="12" fill="#c7d2fe" />
      <rect x="58" y="62" width="104" height="64" rx="12" fill="#a5b4fc" />
      <rect x="62" y="78" width="96" height="58" rx="12" fill="#6366f1" />
      <rect x="74" y="92" width="44" height="8" rx="4" fill="#eef2ff" />
      <rect x="74" y="106" width="72" height="6" rx="3" fill="#c7d2fe" />
      <rect x="74" y="118" width="56" height="6" rx="3" fill="#c7d2fe" />
      <circle cx="168" cy="58" r="7" fill="#fcd34d" />
      <circle cx="44" cy="128" r="5" fill="#fbbf24" />
      <circle cx="178" cy="120" r="4" fill="#a5b4fc" />
    </svg>
  );
}

export function ContentLibraryIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 220 180" fill="none" className={className ?? wrap} aria-hidden="true">
      <ellipse cx="110" cy="152" rx="78" ry="11" fill="#fef3c7" />
      <rect x="78" y="46" width="40" height="54" rx="5" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="86" y="56" width="24" height="5" rx="2.5" fill="#6366f1" />
      <rect x="86" y="66" width="20" height="4" rx="2" fill="#e2e8f0" />
      <rect x="104" y="42" width="40" height="58" rx="5" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="112" y="52" width="24" height="5" rx="2.5" fill="#f43f5e" />
      <rect x="112" y="62" width="20" height="4" rx="2" fill="#e2e8f0" />
      <path d="M48 78h34l9 11h74a9 9 0 0 1 9 9v34a9 9 0 0 1-9 9H48a9 9 0 0 1-9-9V87a9 9 0 0 1 9-9z" fill="#f59e0b" />
      <rect x="39" y="100" width="142" height="50" rx="9" fill="#fcd34d" />
      <circle cx="174" cy="56" r="6" fill="#34d399" />
    </svg>
  );
}

export function SharedIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 220 180" fill="none" className={className ?? wrap} aria-hidden="true">
      <ellipse cx="110" cy="152" rx="78" ry="11" fill="#d1fae5" />
      <path d="M44 132 C 80 96, 120 150, 168 56" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 11" fill="none" />
      <path d="M150 42 L198 64 L156 80 L150 104 L138 82 L114 76 Z" fill="#10b981" />
      <path d="M150 104 L156 80 L198 64 Z" fill="#059669" />
      <path d="M114 76 L156 80 L150 42 Z" fill="#34d399" />
      <circle cx="44" cy="132" r="5" fill="#fbbf24" />
      <circle cx="188" cy="112" r="4" fill="#6ee7b7" />
    </svg>
  );
}

export function AnalyticsIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 220 180" fill="none" className={className ?? wrap} aria-hidden="true">
      <ellipse cx="110" cy="152" rx="78" ry="11" fill="#eef2ff" />
      <rect x="50" y="138" width="120" height="4" rx="2" fill="#cbd5e1" />
      <rect x="62" y="104" width="20" height="34" rx="5" fill="#a5b4fc" />
      <rect x="90" y="84" width="20" height="54" rx="5" fill="#6366f1" />
      <rect x="118" y="62" width="20" height="76" rx="5" fill="#f59e0b" />
      <rect x="146" y="96" width="20" height="42" rx="5" fill="#34d399" />
      <path d="M64 96 L100 78 L128 56 L160 86" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.12" />
      <circle cx="128" cy="56" r="6" fill="#f43f5e" />
    </svg>
  );
}

export function FileRequestsIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 220 180" fill="none" className={className ?? wrap} aria-hidden="true">
      <ellipse cx="110" cy="152" rx="78" ry="11" fill="#dbeafe" />
      <rect x="90" y="44" width="40" height="52" rx="5" fill="#fff" stroke="#bfdbfe" strokeWidth="2" />
      <rect x="98" y="54" width="24" height="5" rx="2.5" fill="#3b82f6" />
      <rect x="98" y="64" width="18" height="4" rx="2" fill="#e2e8f0" />
      <rect x="98" y="74" width="22" height="4" rx="2" fill="#e2e8f0" />
      <path d="M52 110 h26 l8 14 h28 l8 -14 h26 v22 a10 10 0 0 1 -10 10 H62 a10 10 0 0 1 -10 -10 z" fill="#3b82f6" />
      <path d="M52 110 h26 l8 14 h28 l8 -14 h26" stroke="#1d4ed8" strokeWidth="2" fill="none" opacity="0.25" />
      <circle cx="172" cy="58" r="5" fill="#fbbf24" />
    </svg>
  );
}

export function AgreementsIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 220 180" fill="none" className={className ?? wrap} aria-hidden="true">
      <ellipse cx="110" cy="152" rx="78" ry="11" fill="#fecdd3" />
      <rect x="74" y="38" width="72" height="98" rx="8" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="86" y="54" width="48" height="6" rx="3" fill="#f43f5e" />
      <rect x="86" y="68" width="40" height="5" rx="2.5" fill="#e2e8f0" />
      <rect x="86" y="80" width="44" height="5" rx="2.5" fill="#e2e8f0" />
      <path d="M88 110 c 6 -10, 12 8, 18 -2 c 5 -8, 10 6, 16 0" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M150 94 l16 -16 l10 10 l-16 16 z" fill="#f59e0b" />
      <path d="M134 110 l16 -16 l6 6 l-16 16 z" fill="#fbbf24" />
      <circle cx="60" cy="54" r="5" fill="#34d399" />
    </svg>
  );
}
