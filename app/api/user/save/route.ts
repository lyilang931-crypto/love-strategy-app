import { NextResponse } from 'next/server'
import { upsertUser, isSupabaseEnabled } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { user_id, nickname } = await req.json()

    if (!user_id || !nickname?.trim()) {
      return NextResponse.json({ success: false, error: 'user_id と nickname は必須です' }, { status: 400 })
    }

    if (!isSupabaseEnabled()) {
      // Supabase 未設定でも 200 を返してアプリを止めない
      return NextResponse.json({ success: true, saved: false, reason: 'Supabase not configured' })
    }

    const ok = await upsertUser(user_id, nickname.trim())
    return NextResponse.json({ success: ok })
  } catch (err) {
    console.error('[api/user/save]', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
