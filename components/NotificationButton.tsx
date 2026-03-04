'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isPushEnabled,
} from '@/lib/pushNotification'

interface Props {
  compact?: boolean
}

export default function NotificationButton({ compact = false }: Props) {
  const [enabled, setEnabled] = useState(false)
  const [permission, setPermission] = useState<string>('default')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setPermission(getNotificationPermission())
    setEnabled(isPushEnabled())
  }, [])

  // SSR では何も表示しない
  if (!mounted) return null
  // 通知非対応ブラウザでは何も表示しない
  if (permission === 'unsupported') return null
  // ブロックされている場合はメッセージを表示
  if (permission === 'denied') {
    if (compact) return null
    return (
      <p className="text-xs text-gray-500 text-center">
        🔕 通知がブロックされています。ブラウザの設定から許可してください。
      </p>
    )
  }

  const handleToggle = async () => {
    setLoading(true)
    try {
      if (enabled) {
        const ok = await unsubscribeFromPush()
        if (ok) setEnabled(false)
      } else {
        const ok = await subscribeToPush()
        if (ok) {
          setEnabled(true)
          setPermission('granted')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
          enabled
            ? 'bg-gold-400/15 border-gold-400/40 text-gold-400'
            : 'glass border-white/10 text-gray-400 hover:border-gold-400/20'
        }`}
      >
        <span>{enabled ? '🔔' : '🔕'}</span>
        <span>{loading ? '...' : enabled ? 'ON' : 'OFF'}</span>
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 border border-gold-400/10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{enabled ? '🔔' : '🔕'}</span>
          <div>
            <p className="text-white font-bold text-sm">デイリーリマインダー</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {enabled ? '毎日20時にお知らせが届きます' : 'タップして通知をONにする'}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
            enabled ? 'bg-gold-400' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${
              enabled ? 'left-6' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-xs text-gold-400/70 mt-3 pt-3 border-t border-gold-400/10"
        >
          ✓ 「今日の恋愛アクションを確認しましょう」が毎日届きます
        </motion.p>
      )}
    </motion.div>
  )
}
