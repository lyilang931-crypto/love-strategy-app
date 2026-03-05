// ── LINE Messaging API Webhook ──
// LINE公式アカウントへの友だち追加・解除イベントを受け取り、
// user_line_ids テーブルに userId を保存・削除する。
//
// LINE Developers コンソールで設定するWebhook URL:
//   https://your-app.vercel.app/api/line/webhook

import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { saveLineUser, removeLineUser } from '@/lib/supabase'

// LINE Webhook イベントの型（必要なフィールドのみ）
interface LineEvent {
  type: string
  source?: {
    type: string
    userId?: string
  }
}

interface LineWebhookBody {
  destination: string
  events: LineEvent[]
}

// ── リクエストボディの署名を検証 ──
function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64')
  return expected === signature
}

export async function POST(req: Request) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET

  // 環境変数未設定の場合は 500
  if (!channelSecret) {
    console.error('[line/webhook] LINE_CHANNEL_SECRET が未設定です')
    return NextResponse.json({ error: 'server configuration error' }, { status: 500 })
  }

  // ── 1. 生のリクエストボディを取得（署名検証に必要）──
  const rawBody = await req.text()

  // ── 2. 署名検証 ──
  const signature = req.headers.get('x-line-signature') ?? ''
  if (!verifySignature(rawBody, signature, channelSecret)) {
    console.warn('[line/webhook] 署名検証失敗')
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  // ── 3. イベントを処理 ──
  let body: LineWebhookBody
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const events: LineEvent[] = body.events ?? []

  for (const event of events) {
    const userId = event.source?.userId
    if (!userId) continue

    if (event.type === 'follow') {
      // 友だち追加（またはブロック解除）→ userId を保存
      console.log(`[line/webhook] follow: ${userId}`)
      await saveLineUser(userId)

      // 友だち追加時にウェルカムメッセージを送信
      await sendReplyOrPush(userId, [
        {
          type: 'text',
          text: `💕 恋愛戦略AIへようこそ！\n\n毎晩21時に今日のアクションリマインダーをお送りします。\n\nアプリで診断・戦略作成がまだの方はこちらから始めましょう 👇\n${process.env.NEXT_PUBLIC_APP_URL ?? ''}`,
        },
      ])
    } else if (event.type === 'unfollow') {
      // ブロック・友だち解除 → userId を削除
      console.log(`[line/webhook] unfollow: ${userId}`)
      await removeLineUser(userId)
    }
  }

  // LINE サーバーには必ず 200 を返す
  return NextResponse.json({ ok: true })
}

// ── 指定ユーザーへプッシュメッセージを送信 ──
async function sendReplyOrPush(
  userId: string,
  messages: Record<string, unknown>[],
): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return

  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: userId, messages }),
    })
  } catch (err) {
    console.error('[line/webhook] push send error:', err)
  }
}
