import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { link_id, file_id } = await req.json()

  const { data: link } = await supabase
    .from('share_links')
    .select('allow_download, watermark')
    .eq('id', link_id)
    .single()

  if (!link) {
    return NextResponse.json({ error: 'INVALID_LINK' }, { status: 403 })
  }

  const { data: override } = await supabase
    .from('file_permissions')
    .select('allow_download, watermark')
    .eq('share_link_id', link_id)
    .eq('file_id', file_id)
    .single()

  return NextResponse.json({
    allow_download:
      override?.allow_download ?? link.allow_download,
    watermark:
      override?.watermark ?? link.watermark,
  })
}