import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'subscriptions.json')

function readSubs(): PushSubscriptionJSON[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeSubs(subs: PushSubscriptionJSON[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(subs, null, 2))
}

export async function POST(req: Request) {
  try {
    const subscription: PushSubscriptionJSON = await req.json()
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ success: false, error: 'Invalid subscription' }, { status: 400 })
    }

    const subs = readSubs()
    const exists = subs.some((s) => s.endpoint === subscription.endpoint)
    if (!exists) {
      subs.push(subscription)
      writeSubs(subs)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[push/subscribe] error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
