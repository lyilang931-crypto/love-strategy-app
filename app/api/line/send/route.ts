// ── LINE デイリーリマインダー送信（Vercel Cron / 手動実行）──
// Vercel Cron により毎晩21時(JST) = 12:00(UTC) に自動実行。
// Authorization ヘッダーで CRON_SECRET を検証してからメッセージを送信する。
//
// 手動テスト:
//   curl -X POST https://your-app.vercel.app/api/line/send \
//        -H "Authorization: Bearer {CRON_SECRET}"

import { NextResponse } from 'next/server'
import { fetchLineUsers } from '@/lib/supabase'

// LINE Multicast API の上限（1リクエストあたり最大500件）
const MULTICAST_CHUNK_SIZE = 500

// ── リマインダーメッセージ（日替わり風に複数用意してランダム選択）──
const REMINDER_MESSAGES = [
  `💕 今日の恋愛アクション、できましたか？\n\n「昨日より少しだけ勇気を出す」\nそれだけで恋愛は変わっていきます。\n\n今日の進捗を記録して、理想の恋愛に一歩近づきましょう ✨\n\n📊 今日の進捗を記録する\n${process.env.NEXT_PUBLIC_APP_URL ?? ''}/progress`,

  `🔥 あなたの3ヶ月戦略、今日も着実に進めていますか？\n\n毎日の小さな行動が、3ヶ月後に大きな差を生みます。\n\n今夜5分だけ、今日の気づきを記録してみてください 📝\n\n${process.env.NEXT_PUBLIC_APP_URL ?? ''}/progress`,

  `✨ 今日はどんな出来事がありましたか？\n\n進捗ダッシュボードに記録すると、自分の成長が見えてきます。\n継続することが、最大の恋愛戦略です 💪\n\n${process.env.NEXT_PUBLIC_APP_URL ?? ''}/progress`,

  `💫 今夜のリマインダーです。\n\n戦略を立てることより、毎日少しずつ動き続けること。\nそれがAIコーチングで成果を出す唯一の方法です。\n\n今日の行動を振り返ってみましょう 🌙\n\n${process.env.NEXT_PUBLIC_APP_URL ?? ''}/progress`,
]

function getRandomMessage(): string {
  const index = Math.floor(Math.random() * REMINDER_MESSAGES.length)
  return REMINDER_MESSAGES[index]
}

// 配列を指定サイズに分割するユーティリティ
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

// ── LINE Multicast API を呼び出す ──
async function sendMulticast(
  userIds: string[],
  message: string,
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('https://api.line.me/v2/bot/message/multicast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: userIds,
      messages: [{ type: 'text', text: message }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    return { ok: false, error: `HTTP ${res.status}: ${body}` }
  }
  return { ok: true }
}

export async function POST(req: Request) {
  // ── 1. CRON_SECRET による認証 ──
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization') ?? ''
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) {
    console.error('[line/send] LINE_CHANNEL_ACCESS_TOKEN が未設定です')
    return NextResponse.json(
      { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' },
      { status: 500 },
    )
  }

  // ── 2. 送信対象の userId 一覧を取得 ──
  const userIds = await fetchLineUsers()
  console.log(`[line/send] 送信対象: ${userIds.length}件`)

  if (userIds.length === 0) {
    return NextResponse.json({ success: true, sent: 0, message: '送信対象ユーザーなし' })
  }

  // ── 3. メッセージを選択 ──
  const message = getRandomMessage()

  // ── 4. 500件ずつ分割して Multicast 送信 ──
  const chunks = chunk(userIds, MULTICAST_CHUNK_SIZE)
  let totalSent = 0
  const errors: string[] = []

  for (const batch of chunks) {
    const result = await sendMulticast(batch, message, token)
    if (result.ok) {
      totalSent += batch.length
    } else {
      console.error(`[line/send] multicast error: ${result.error}`)
      errors.push(result.error ?? 'unknown error')
    }
  }

  console.log(`[line/send] 送信完了: ${totalSent}件 / エラー: ${errors.length}件`)

  return NextResponse.json({
    success: errors.length === 0,
    sent: totalSent,
    total: userIds.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}

// Vercel Cron は GET リクエストを送るため、GET も受け付けて POST に委譲する
export async function GET(req: Request) {
  return POST(req)
}
