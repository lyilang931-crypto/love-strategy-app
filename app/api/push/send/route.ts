import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import webpush from 'web-push'
import {
  fetchPushUsers,
  removePushSubscription,
  isSupabaseEnabled,
  type LoveUser,
} from '@/lib/supabase'

const DATA_FILE = path.join(process.cwd(), 'data', 'subscriptions.json')

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'admin@example.com'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || '',
)

// ニックネームを使ったパーソナライズメッセージ
function buildPayload(nickname?: string) {
  const name = nickname?.trim() ? `${nickname.trim()}さん` : ''
  const greetings = [
    { title: '恋愛戦略AI', body: `今日の恋愛アクションを確認しましょう${name ? '、' + name : ''} 💕`, url: '/plan' },
    { title: `${name || 'あなた'}へ`, body: '小さな行動が理想の恋愛を引き寄せます ✨', url: '/plan' },
    { title: 'デイリーリマインダー', body: `今日のチェックリストを完了させましょう${name ? '、' + name : ''} 🎯`, url: '/plan' },
    { title: '進捗を記録しよう', body: '昨日の行動を振り返って記録しましょう 📊', url: '/progress' },
    { title: '継続は力なり', body: `毎日の積み重ねが結果につながります${name ? '、' + name : ''} 🔥`, url: '/plan' },
  ]
  return greetings[Math.floor(Math.random() * greetings.length)]
}

type PushTarget = {
  endpoint: string
  keys?: { p256dh?: string; auth?: string }
  nickname?: string
}

export async function POST(req: Request) {
  // Cron 保護
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let targets: PushTarget[] = []

  if (isSupabaseEnabled()) {
    // ── Supabase モード: nickname 付きでフェッチ ──
    const users: LoveUser[] = await fetchPushUsers()
    targets = users
      .filter((u) => u.push_endpoint)
      .map((u) => ({
        endpoint: u.push_endpoint!,
        keys: { p256dh: u.push_p256dh ?? undefined, auth: u.push_auth ?? undefined },
        nickname: u.nickname,
      }))
  } else {
    // ── ファイルフォールバック ──
    try {
      const subs: PushSubscriptionJSON[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
      targets = subs
        .filter((s) => s.endpoint)
        .map((s) => ({
          endpoint: s.endpoint!,
          keys: s.keys as { p256dh?: string; auth?: string } | undefined,
        }))
    } catch {
      return NextResponse.json({ success: true, sent: 0, message: 'No subscriptions' })
    }
  }

  if (targets.length === 0) {
    return NextResponse.json({ success: true, sent: 0 })
  }

  const results = await Promise.allSettled(
    targets.map((t) => {
      const payload = buildPayload(t.nickname)
      const sub = {
        endpoint: t.endpoint,
        keys: t.keys ?? {},
      }
      return webpush.sendNotification(
        sub as Parameters<typeof webpush.sendNotification>[0],
        JSON.stringify(payload),
      )
    })
  )

  // 410 Gone（購読切れ）を自動削除
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'rejected') {
      const err = r.reason as { statusCode?: number }
      if (err?.statusCode === 410) {
        const endpoint = targets[i].endpoint
        if (isSupabaseEnabled()) {
          await removePushSubscription(endpoint)
        } else {
          try {
            const subs: PushSubscriptionJSON[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
            fs.writeFileSync(DATA_FILE, JSON.stringify(subs.filter((s) => s.endpoint !== endpoint), null, 2))
          } catch { /* ignore */ }
        }
      }
    }
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ success: true, sent, total: targets.length })
}

export async function GET(req: Request) {
  return POST(req)
}
