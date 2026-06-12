'use client';

/**
 * LinkSettingsDemo - the interactive "Link settings" card on the landing page.
 * Mirrors the real Share dialog's controls (Require email, Password,
 * Expiration, Allow / block list, Watermark, Require NDA, Require signature)
 * and lets visitors actually toggle them, so the page demos the product.
 */

import { useState } from 'react';
import { Copy } from 'lucide-react';

const BLUE = '#4285F4';

const ROWS: { key: string; label: string; on: boolean; value?: string }[] = [
  { key: 'email', label: 'Require email to view', on: true },
  { key: 'password', label: 'Password', on: true, value: '••••••' },
  { key: 'expiry', label: 'Expiration', on: true, value: 'Jul 15, 2026' },
  { key: 'allowblock', label: 'Allow / block list', on: false },
  { key: 'watermark', label: 'Watermark', on: true },
  { key: 'nda', label: 'Require NDA', on: false },
  { key: 'signature', label: 'Require signature', on: false },
];

export function LinkSettingsDemo() {
  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ROWS.map((r) => [r.key, r.on])),
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">Link settings</p>
      <p className="text-xs text-gray-400">Series A Data Room</p>

      <div className="mt-4 space-y-3">
        {ROWS.map((r) => (
          <div key={r.key} className="flex items-center justify-between">
            <span className="text-[13px] text-gray-700">{r.label}</span>
            <span className="flex items-center gap-2">
              {r.value && on[r.key] && <span className="text-[12px] text-gray-400">{r.value}</span>}
              <button
                type="button"
                aria-pressed={on[r.key]}
                aria-label={r.label}
                onClick={() => setOn((p) => ({ ...p, [r.key]: !p[r.key] }))}
                className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${on[r.key] ? '' : 'bg-gray-200'}`}
                style={on[r.key] ? { background: BLUE } : undefined}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${on[r.key] ? 'ml-auto' : ''}`}
                />
              </button>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
        <span className="truncate text-[12px] text-gray-500">venturethrust.com/shared/x7Kq2m</span>
        <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color: BLUE }}>
          <Copy className="h-3 w-3" /> Copy
        </span>
      </div>
      <p className="mt-2 text-center text-[11px] text-gray-400">Try the toggles - this is the real control panel.</p>
    </div>
  );
}
