/**
 * Build a Supabase Storage-safe object key segment from a filename.
 *
 * Supabase Storage rejects keys containing characters outside a limited set
 * (non-ASCII letters like Hindi, square brackets, etc.) with HTTP 400
 * "Invalid key". Each file is already stored under a unique id, so the name
 * part only needs to be safe and keep its extension; the original (pretty)
 * filename is kept in the database for display.
 */
export function safeStorageKey(name: string): string {
  const lastDot = name.lastIndexOf('.');
  const rawExt = lastDot > 0 ? name.slice(lastDot + 1) : '';
  const ext = rawExt.replace(/[^A-Za-z0-9]/g, '').slice(0, 12).toLowerCase();
  const base =
    (lastDot > 0 ? name.slice(0, lastDot) : name)
      .normalize('NFKD')
      .replace(/[^\x20-\x7E]/g, '') // drop non-ASCII (e.g. Hindi script)
      .replace(/[^A-Za-z0-9._-]+/g, '_') // unsafe chars -> underscore
      .replace(/_+/g, '_')
      .replace(/^[._]+|[._]+$/g, '')
      .slice(0, 80) || 'file';
  return ext ? `${base}.${ext}` : base;
}
