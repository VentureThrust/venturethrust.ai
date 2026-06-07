import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { share_link_id, file_id, email, action } = await req.json()

  await supabase.from('share_link_access_logs').insert({
    share_link_id,
    file_id,
    email,
    action,
  })

  await supabase.from('alerts').insert({
    type: 'share_link_access',
    metadata: {
      share_link_id,
      file_id,
      email,
      action,
    },
  })

  return NextResponse.json({ ok: true })
}