import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'subscriptions.json')

export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json()
    if (!endpoint) {
      return NextResponse.json({ success: false, error: 'endpoint required' }, { status: 400 })
    }

    let subs: PushSubscriptionJSON[] = []
    try {
      subs = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    } catch { /* file not found */ }

    const filtered = subs.filter((s) => s.endpoint !== endpoint)
    fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[push/unsubscribe] error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
