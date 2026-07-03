/**
 * Deal Watch - SERVER-ONLY shared helpers for the /api/deal-watch/* routes.
 * Do not import from client components (uses the service-role key).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DW_MANAGER_EMAIL } from '@/lib/deal-watch';

export const dwAdmin: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Resolve the caller from the Authorization: Bearer <jwt> header. */
export async function dwCaller(req: Request): Promise<{ id: string; email: string } | null> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  const { data, error } = await dwAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: (data.user.email ?? '').toLowerCase() };
}

export async function dwIsInvestor(userId: string): Promise<boolean> {
  const { data } = await dwAdmin
    .from('profiles')
    .select('is_investor')
    .eq('id', userId)
    .maybeSingle();
  return (data as { is_investor?: boolean } | null)?.is_investor === true;
}

/** The account manager's profile id (single human manager for now). */
export async function dwManagerId(): Promise<string | null> {
  const { data } = await dwAdmin
    .from('profiles')
    .select('id')
    .ilike('email', DW_MANAGER_EMAIL)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

/** Best-effort in-app alert + email to the account manager. Never throws. */
export async function dwNotifyManager(opts: {
  managerId: string | null;
  subject: string;
  message: string;
  alertType: string;
}): Promise<void> {
  try {
    if (opts.managerId) {
      await dwAdmin.from('alerts').insert({
        user_id: opts.managerId,
        space_id: null,
        type: opts.alertType,
        message: opts.message,
      });
    }
  } catch (e) {
    console.warn('[deal-watch] manager alert failed:', e);
  }

  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpHost || !smtpUser || !smtpPass) return;
    // @ts-ignore - nodemailer ships no bundled types
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass },
    });
    const fromAddr = process.env.SMTP_FROM ?? `VentureThrust <${smtpUser}>`;
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://venturethrust.com').replace(/\/$/, '');
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    await transporter.sendMail({
      from: fromAddr,
      to: DW_MANAGER_EMAIL,
      subject: opts.subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
          <h2 style="font-weight:600">Deal Watch</h2>
          <p>${esc(opts.message)}</p>
          <p style="margin:28px 0">
            <a href="${appUrl}/deal-watch" style="background:#4285F4;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">Open Deal Watch</a>
          </p>
        </div>`,
    });
  } catch (e) {
    console.warn('[deal-watch] manager email failed:', e);
  }
}
