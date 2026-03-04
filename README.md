# 💫 恋愛戦略AI

AIが恋愛コーチとして徹底的にヒアリングし、その人だけの恋愛戦略を提案するWebアプリ。

---

## 🚀 セットアップ

### 1. 依存パッケージをインストール

```bash
npm install
```

### 2. 環境変数を設定

`.env.local.example` をコピーして `.env.local` を作成し、APIキーを入力します。

```bash
cp .env.local.example .env.local
```

`.env.local` を編集：

```env
# Gemini API Key（必須）
# https://aistudio.google.com/ で無料取得可能
GEMINI_API_KEY=your_gemini_api_key_here

# CoconalaコーチングページURL（任意）
NEXT_PUBLIC_COCONALA_URL=https://coconala.com/your-service-url
```

> **GEMINI_API_KEY が未設定の場合**、自動的にモックレスポンスで動作します。開発・デモ用途に便利です。

### 3. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

### 4. 本番ビルド

```bash
npm run build
npm start
```

---

## 📱 ページ構成

| ページ | URL | 説明 |
|--------|-----|------|
| ランディング | `/` | ヒーロー・特徴・実績 |
| ヒアリング | `/hearing` | 6ステップ質問フォーム |
| 性格診断 | `/diagnosis` | 12問の恋愛タイプ診断 |
| 戦略提案 | `/strategy` | AI生成の個別戦略 |
| 週次プラン | `/plan` | 4週間行動計画 |
| 進捗記録 | `/progress` | ダッシュボード＆記録 |

---

## 🎨 デザイン

- **カラー**: ネイビー × ゴールド
- **スタイル**: グラスモーフィズム + Framer Motion アニメーション
- **対応**: モバイルファースト・レスポンシブ対応

---

## 🛠 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **AI**: Google Gemini 1.5 Flash
- **Storage**: localStorage（ユーザーデータ）

---

## 📂 ディレクトリ構成

```
love-strategy-app/
├── app/
│   ├── globals.css          # グローバルスタイル
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # ランディングページ
│   ├── hearing/page.tsx     # ヒアリング（6ステップ）
│   ├── diagnosis/page.tsx   # 性格診断（12問）
│   ├── strategy/page.tsx    # AI戦略提案
│   ├── plan/page.tsx        # 週次行動計画
│   ├── progress/page.tsx    # 進捗ダッシュボード
│   └── api/generate/        # Gemini API エンドポイント
│       └── route.ts
├── components/
│   └── CoconalaCTA.tsx      # Coconala誘導コンポーネント
├── lib/
│   └── types.ts             # 型定義
└── .env.local.example       # 環境変数テンプレート
```

---

## 🔧 カスタマイズ

### Coconala URLの変更
`.env.local` の `NEXT_PUBLIC_COCONALA_URL` を自分のサービスURLに変更。

### 返金保証メッセージの変更
`components/CoconalaCTA.tsx` 内の文言を編集。

### 性格タイプの追加
`app/diagnosis/page.tsx` の `TYPES` オブジェクトに追加。

---

## 🌐 Vercelへのデプロイ

```bash
# Vercel CLIでデプロイ
npx vercel

# 環境変数はVercelダッシュボードで設定
# Settings → Environment Variables
# GEMINI_API_KEY=xxx
# NEXT_PUBLIC_COCONALA_URL=xxx
```

---

## 📋 ユーザーフロー

```
① ランディング (/）
    ↓「無料で始める」
② ヒアリング（6ステップ）
    ↓ 自動遷移
③ 性格診断（12問）
    ↓ 診断完了
④ 戦略提案（Gemini AI生成）
    ↓「週次プランを見る」
⑤ 週次行動計画（チェックリスト）
    ↓「進捗を記録する」
⑥ 進捗ダッシュボード（継続利用）
    ↓ 各ページでCoconala誘導
```
