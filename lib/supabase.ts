// ── Supabase クライアント ──
// @supabase/supabase-js を使用。未設定時は null を返しフォールバックで動作。

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null

export const isSupabaseEnabled = (): boolean => Boolean(url && key)

// ── テーブル型 ──
export interface LoveUser {
  user_id: string
  nickname: string
  push_endpoint: string | null
  push_p256dh: string | null
  push_auth: string | null
  created_at?: string
  updated_at?: string
}

// ── ユーザーを upsert（なければ作成、あれば nickname を更新）──
export async function upsertUser(
  user_id: string,
  nickname: string,
): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('love_users').upsert(
    { user_id, nickname, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  return !error
}

// ── Push 購読情報を保存 ──
export async function savePushSubscription(
  user_id: string,
  sub: PushSubscriptionJSON,
): Promise<boolean> {
  if (!supabase) return false
  const keys = sub.keys as { p256dh?: string; auth?: string } | undefined
  const { error } = await supabase.from('love_users').upsert(
    {
      user_id,
      push_endpoint: sub.endpoint,
      push_p256dh: keys?.p256dh ?? null,
      push_auth: keys?.auth ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  return !error
}

// ── Push 購読済みユーザー一覧を取得 ──
export async function fetchPushUsers(): Promise<LoveUser[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('love_users')
    .select('*')
    .not('push_endpoint', 'is', null)
  if (error || !data) return []
  return data as LoveUser[]
}

// ── 切れた購読を削除 ──
export async function removePushSubscription(endpoint: string): Promise<void> {
  if (!supabase) return
  await supabase
    .from('love_users')
    .update({
      push_endpoint: null,
      push_p256dh: null,
      push_auth: null,
      updated_at: new Date().toISOString(),
    })
    .eq('push_endpoint', endpoint)
}

// ============================================================
// LINE ユーザー管理（user_line_ids テーブル）
// ============================================================

export interface LineUser {
  line_user_id: string
  created_at?: string
}

// LINE userId を保存（友だち追加時）
export async function saveLineUser(line_user_id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase
    .from('user_line_ids')
    .upsert({ line_user_id }, { onConflict: 'line_user_id' })
  if (error) console.error('[supabase] saveLineUser error:', error)
  return !error
}

// LINE userId を削除（ブロック・友だち解除時）
export async function removeLineUser(line_user_id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('user_line_ids')
    .delete()
    .eq('line_user_id', line_user_id)
  if (error) console.error('[supabase] removeLineUser error:', error)
}

// リマインダー送信対象の LINE userId 一覧を取得
export async function fetchLineUsers(): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('user_line_ids')
    .select('line_user_id')
  if (error || !data) {
    console.error('[supabase] fetchLineUsers error:', error)
    return []
  }
  return data.map((row) => (row as LineUser).line_user_id)
}
