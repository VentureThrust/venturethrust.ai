/**
 * Device fingerprint (client-side, best-effort).
 *
 * Produces a stable-ish hash from device/browser signals - including a canvas
 * fingerprint, which survives incognito and clearing storage - so the free
 * plan can be limited to once per device, not once per email. This RAISES the
 * bar against abuse (10 throwaway emails on one laptop), but it is not
 * unbeatable: a different browser, another device, or a spoofing extension can
 * still produce a new fingerprint. Treat it as friction, not a hard wall.
 */

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function canvasSignal(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    canvas.width = 240;
    canvas.height = 60;
    ctx.textBaseline = 'top';
    ctx.font = "16px 'Arial'";
    ctx.fillStyle = '#f60';
    ctx.fillRect(10, 10, 100, 30);
    ctx.fillStyle = '#069';
    ctx.fillText('VentureThrust ✨ fp', 12, 14);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('VentureThrust ✨ fp', 14, 16);
    return canvas.toDataURL();
  } catch {
    return 'canvas-error';
  }
}

export async function getDeviceFingerprint(): Promise<string> {
  try {
    const n = navigator as Navigator & { deviceMemory?: number; platform?: string };
    const signals = [
      n.userAgent || '',
      Array.isArray(n.languages) ? n.languages.join(',') : n.language || '',
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      String(n.hardwareConcurrency || ''),
      String(n.deviceMemory || ''),
      String(n.platform || ''),
      canvasSignal(),
    ];
    return (await sha256Hex(signals.join('|'))).slice(0, 48);
  } catch {
    return '';
  }
}
