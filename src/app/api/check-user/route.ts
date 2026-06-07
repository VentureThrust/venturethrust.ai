// app/api/check-user/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { email } = await req.json();

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    return NextResponse.json({ error: true }, { status: 500 });
  }

  const user = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    return NextResponse.json({ status: 'NOT_EXISTS' });
  }

  // `has_own_account` is set when someone self-signs-up or "claims" their own
  // account. An invite-created account (from generateLink) doesn't have it.
  const hasOwnAccount =
    (user.user_metadata as Record<string, unknown> | undefined)?.has_own_account === true;

  // Is this email a member of someone's workspace (i.e. an invitee)? Only such
  // users are offered the "set up your own account" path; everyone else with an
  // existing account is told to log in.
  const { data: memberRow } = await supabaseAdmin
    .from('workspace_members')
    .select('id')
    .eq('member_user_id', user.id)
    .limit(1)
    .maybeSingle();
  const isInvitee = !!memberRow;

  if (user.email_confirmed_at) {
    return NextResponse.json({ status: 'CONFIRMED', hasOwnAccount, isInvitee });
  }

  return NextResponse.json({ status: 'UNCONFIRMED', hasOwnAccount, isInvitee });
}
