import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { savePushSubscription, isSupabaseEnabled } from '@/lib/supabase'

const DATA_FILE = path.join(process.cwd(), 'data', 'subscriptions.json')

function readSubs(): PushSubscriptionJSON[] {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) } catch { return [] }
}
function writeSubs(subs: PushSubscriptionJSON[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(subs, null, 2))
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // { subscription, user_id } 形式と生の PushSubscriptionJSON 両方に対応
    const subscription: PushSubscriptionJSON = body.subscription ?? body
    const user_id: string | undefined = body.user_id

    if (!subscription?.endpoint) {
      return NextResponse.json({ success: false, error: 'Invalid subscription' }, { status: 400 })
    }

    if (isSupabaseEnabled() && user_id) {
      // ── Supabase モード: user_id に紐付けて保存 ──
      await savePushSubscription(user_id, subscription)
    } else {
      // ── ファイルフォールバック ──
      const subs = readSubs()
      if (!subs.some((s) => s.endpoint === subscription.endpoint)) {
        subs.push(subscription)
        writeSubs(subs)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[push/subscribe]', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
