import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import webpush from 'web-push'

const DATA_FILE = path.join(process.cwd(), 'data', 'subscriptions.json')

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'admin@example.com'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || '',
)

const DAILY_MESSAGES = [
  { title: '恋愛戦略AI', body: '今日の恋愛アクションを確認しましょう 💕', url: '/plan' },
  { title: '今日も一歩前へ', body: '小さな行動が理想の恋愛を引き寄せます ✨', url: '/plan' },
  { title: 'デイリーリマインダー', body: '今日のチェックリストを完了させましょう 🎯', url: '/plan' },
  { title: '進捗を記録しよう', body: '昨日の行動を振り返って記録しましょう 📊', url: '/progress' },
  { title: '継続は力なり', body: `連続アクセス中！今日も恋愛戦略を実践しよう 🔥`, url: '/plan' },
]

export async function POST(req: Request) {
  // Vercel Cron の場合は Authorization ヘッダーで保護
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // カスタムメッセージがあれば使用、なければランダムに選択
  let payload = DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)]
  try {
    const body = await req.json().catch(() => null)
    if (body?.title) payload = body
  } catch { /* ignore */ }

  let subs: PushSubscriptionJSON[] = []
  try {
    subs = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return NextResponse.json({ success: true, sent: 0, message: 'No subscriptions file' })
  }

  if (subs.length === 0) {
    return NextResponse.json({ success: true, sent: 0 })
  }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        sub as Parameters<typeof webpush.sendNotification>[0],
        JSON.stringify(payload),
      )
    )
  )

  // 410 Gone（購読切れ）を自動削除
  const invalidEndpoints = new Set<string>()
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const err = r.reason as { statusCode?: number }
      if (err?.statusCode === 410 && subs[i]?.endpoint) {
        invalidEndpoints.add(subs[i].endpoint as string)
      }
    }
  })

  if (invalidEndpoints.size > 0) {
    const cleaned = subs.filter((s) => !invalidEndpoints.has(s.endpoint as string))
    fs.writeFileSync(DATA_FILE, JSON.stringify(cleaned, null, 2))
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ success: true, sent, total: subs.length })
}

// Vercel Cron からの GET リクエストにも対応
export async function GET(req: Request) {
  return POST(req)
}
