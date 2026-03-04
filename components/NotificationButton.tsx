'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getPushSupportState,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isPushEnabled,
  type PushSupportState,
} from '@/lib/pushNotification'

interface Props {
  compact?: boolean
}

// ── 通知状態 UI マッピング ──
type UIState =
  | 'loading'          // マウント中
  | 'unsupported'      // Push API 非対応
  | 'ios-safari'       // iOS Safari（PWAインストール必要）
  | 'denied'           // 通知ブロック済み
  | 'default-on'       // 未確認だが enabled フラグあり（再起動後など）
  | 'default'          // 未確認・未登録
  | 'enabled'          // 許可済み・登録済み
  | 'disabled'         // 許可済みだが未登録（例: 解除後）

export default function NotificationButton({ compact = false }: Props) {
  const [uiState, setUIState] = useState<UIState>('loading')
  const [actionLoading, setActionLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // ── 状態を同期する関数 ──
  const syncState = useCallback(() => {
    const support: PushSupportState = getPushSupportState()
    if (support === 'ios-safari') { setUIState('ios-safari'); return }
    if (support === 'unsupported') { setUIState('unsupported'); return }

    const perm = getNotificationPermission()
    if (perm === 'denied') { setUIState('denied'); return }

    const enabled = isPushEnabled()
    if (perm === 'granted' && enabled) { setUIState('enabled'); return }
    if (perm === 'granted' && !enabled) { setUIState('disabled'); return }

    // perm === 'default'
    setUIState(enabled ? 'default-on' : 'default')
  }, [])

  useEffect(() => {
    setMounted(true)
    syncState()

    // バックグラウンドから戻ってきたとき（設定アプリから許可変更後）に再チェック
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncState()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [syncState])

  // ── アクション: 通知を有効にする ──
  const handleEnable = async () => {
    setActionLoading(true)
    try {
      const ok = await subscribeToPush()
      if (ok) {
        setUIState('enabled')
      } else {
        // 失敗した場合は状態を再同期（denied になっている可能性）
        syncState()
      }
    } finally {
      setActionLoading(false)
    }
  }

  // ── アクション: 通知を無効にする ──
  const handleDisable = async () => {
    setActionLoading(true)
    try {
      const ok = await unsubscribeFromPush()
      if (ok) setUIState('disabled')
    } finally {
      setActionLoading(false)
    }
  }

  if (!mounted || uiState === 'loading') return null

  // ───────────────────────────────────────────────
  // コンパクトモード（ヘッダー等に置くミニボタン）
  // ───────────────────────────────────────────────
  if (compact) {
    if (uiState === 'unsupported') return null
    if (uiState === 'ios-safari') return null

    if (uiState === 'denied') {
      return (
        <span className="flex items-center gap-1 text-xs text-gray-500 px-2">
          🔕 通知ブロック中
        </span>
      )
    }

    const isOn = uiState === 'enabled'
    const label = actionLoading ? '...' : isOn ? 'ON' : 'OFF'
    const emoji = isOn ? '🔔' : '🔕'

    return (
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={isOn ? handleDisable : handleEnable}
        disabled={actionLoading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
          isOn
            ? 'bg-gold-400/15 border-gold-400/40 text-gold-400'
            : 'glass border-white/10 text-gray-400 hover:border-gold-400/20'
        }`}
      >
        <span>{emoji}</span>
        <span>{label}</span>
      </motion.button>
    )
  }

  // ───────────────────────────────────────────────
  // 通常モード（plan ページ内の通知カード）
  // ───────────────────────────────────────────────

  // ── 非対応 ──
  if (uiState === 'unsupported') {
    return (
      <div className="glass rounded-2xl p-5 border border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔕</span>
          <div>
            <p className="text-gray-300 font-bold text-sm">デイリーリマインダー</p>
            <p className="text-gray-500 text-xs mt-0.5">
              このブラウザはプッシュ通知に対応していません
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── iOS Safari（非PWA）──
  if (uiState === 'ios-safari') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 border border-gold-400/15"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">📲</span>
          <div className="flex-1">
            <p className="text-white font-bold text-sm mb-1">デイリーリマインダー</p>
            <p className="text-gray-300 text-xs leading-relaxed">
              iOSでプッシュ通知を受け取るには、このアプリをホーム画面に追加してください。
            </p>
            <div className="mt-3 bg-gold-400/8 border border-gold-400/20 rounded-xl p-3 space-y-1.5">
              <p className="text-gold-400 text-xs font-bold">📋 手順</p>
              <p className="text-gray-300 text-xs">① Safari 下部の <span className="text-gold-300">共有アイコン</span>（□↑）をタップ</p>
              <p className="text-gray-300 text-xs">② 「<span className="text-gold-300">ホーム画面に追加</span>」を選択</p>
              <p className="text-gray-300 text-xs">③ ホーム画面から再度アプリを開く</p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── 通知ブロック済み（denied）──
  if (uiState === 'denied') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 border border-red-400/20"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🔕</span>
          <div className="flex-1">
            <p className="text-white font-bold text-sm mb-1">通知がブロックされています</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              ブラウザの設定で通知を許可してください。
            </p>
            <div className="mt-3 bg-red-400/8 border border-red-400/20 rounded-xl p-3 space-y-1">
              <p className="text-red-300 text-xs font-bold">🔓 許可方法</p>
              <p className="text-gray-400 text-xs">アドレスバーの 🔒 アイコン → 通知 → 許可</p>
              <p className="text-gray-400 text-xs">※ iOS: 設定 → Safari → 通知 で変更</p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── デフォルト（未確認・未登録）──
  if (uiState === 'default' || uiState === 'default-on') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 border border-gold-400/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🔔</span>
          <div>
            <p className="text-white font-bold text-sm">デイリーリマインダー</p>
            <p className="text-gray-400 text-xs mt-0.5">毎日20時に恋愛アクションをお知らせ</p>
          </div>
        </div>
        <button
          onClick={handleEnable}
          disabled={actionLoading}
          className="w-full btn-gold py-3 rounded-xl text-sm font-bold disabled:opacity-60 active:scale-95 transition-all"
        >
          {actionLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              許可をリクエスト中…
            </span>
          ) : (
            '🔔 通知を有効にする'
          )}
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          タップすると通知の許可ダイアログが表示されます
        </p>
      </motion.div>
    )
  }

  // ── 許可済み・登録解除状態（disabled）──
  if (uiState === 'disabled') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 border border-white/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔕</span>
            <div>
              <p className="text-white font-bold text-sm">デイリーリマインダー</p>
              <p className="text-gray-400 text-xs mt-0.5">現在オフです</p>
            </div>
          </div>
          {/* トグル: OFF */}
          <button
            onClick={handleEnable}
            disabled={actionLoading}
            aria-label="通知をオンにする"
            className="relative w-12 h-6 rounded-full bg-gray-600 transition-all duration-300 flex-shrink-0 disabled:opacity-50"
          >
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300" />
            {actionLoading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-3 h-3 border border-white/60 border-t-white rounded-full animate-spin" />
              </span>
            )}
          </button>
        </div>
      </motion.div>
    )
  }

  // ── 有効（enabled）──
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 border border-gold-400/20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <p className="text-white font-bold text-sm">デイリーリマインダー</p>
            <p className="text-gray-400 text-xs mt-0.5">毎日20時にお知らせが届きます</p>
          </div>
        </div>
        {/* トグル: ON */}
        <button
          onClick={handleDisable}
          disabled={actionLoading}
          aria-label="通知をオフにする"
          className="relative w-12 h-6 rounded-full bg-gold-400 transition-all duration-300 flex-shrink-0 disabled:opacity-60"
        >
          <span className="absolute top-0.5 left-6 w-5 h-5 rounded-full bg-white shadow transition-all duration-300" />
          {actionLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-3 h-3 border border-white/60 border-t-white rounded-full animate-spin" />
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <p className="text-xs text-gold-400/70 mt-3 pt-3 border-t border-gold-400/10">
            ✓ 「今日の恋愛アクションを確認しましょう」が毎日届きます
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
