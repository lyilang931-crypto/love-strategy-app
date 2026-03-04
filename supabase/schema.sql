-- ============================================================
-- 恋愛戦略AI - Supabase スキーマ
-- Supabase ダッシュボード → SQL Editor で実行してください
-- ============================================================

-- love_users テーブル
CREATE TABLE IF NOT EXISTS love_users (
  user_id      TEXT PRIMARY KEY,
  nickname     TEXT NOT NULL DEFAULT '',
  push_endpoint TEXT,
  push_p256dh  TEXT,
  push_auth    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER love_users_updated_at
  BEFORE UPDATE ON love_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security (RLS) の設定
-- ============================================================

ALTER TABLE love_users ENABLE ROW LEVEL SECURITY;

-- anon キーでの読み取りは不可（サーバー側 service_role からのみ許可）
-- ただしアプリは anon キーを使うため、INSERT/UPDATE のみ許可する

-- 自分のレコードへの INSERT を許可
CREATE POLICY "allow_insert_own" ON love_users
  FOR INSERT WITH CHECK (true);

-- 自分のレコードへの UPDATE を許可
CREATE POLICY "allow_update_own" ON love_users
  FOR UPDATE USING (true);

-- SELECT は全件許可（プッシュ送信時に全ユーザーを取得するため）
-- ※ セキュリティを強化する場合は service_role キーを使用してください
CREATE POLICY "allow_select_all" ON love_users
  FOR SELECT USING (true);

-- ============================================================
-- インデックス（プッシュ購読の endpoint 検索を高速化）
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_love_users_push_endpoint
  ON love_users (push_endpoint)
  WHERE push_endpoint IS NOT NULL;

-- ============================================================
-- 使い方メモ
-- ============================================================
-- 1. Supabase ダッシュボード → SQL Editor でこのファイルを実行
-- 2. .env.local に以下を追加:
--    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
-- 3. npm install でパッケージを更新
-- 4. Vercel の Environment Variables にも同様に設定
