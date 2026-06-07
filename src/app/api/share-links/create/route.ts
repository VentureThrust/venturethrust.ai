import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()

  const {
    space_id,
    email_required,
    password,
    expires_at,
    allow_download,
    watermark,
  } = body

  const password_hash = password
    ? await bcrypt.hash(password, 10)
    : null

  const { data, error } = await supabase
    .from('share_links')
    .insert({
      space_id,
      email_required,
      password_hash,
      expires_at,
      allow_download,
      watermark,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: true }, { status: 500 })
  }

  return NextResponse.json({ link: data })
}