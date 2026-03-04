'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { recordVisit, getStreakEmoji, type StreakData } from '@/lib/streak'

export default function StreakBadge() {
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    const data = recordVisit()
    setStreak(data)
  }, [])

  if (!streak) return null

  const emoji = getStreakEmoji(streak.count)
  const isNew = streak.count > 1 && streak.lastVisit === new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\//g, '-')

  return (
    <div className="relative">
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => setShowDetail((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-gold-400/30 hover:border-gold-400/60 transition-all"
      >
        <span className="text-lg">{emoji}</span>
        <div className="text-left">
          <p className="text-gold-400 font-bold text-sm leading-none">{streak.count}日連続</p>
        </div>
        {streak.count >= 3 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="w-2 h-2 rounded-full bg-gold-400 animate-pulse"
          />
        )}
      </motion.button>

      {/* Detail popup */}
      <AnimatePresence>
        {showDetail && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDetail(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 right-0 z-50 glass rounded-2xl p-4 w-52 border border-gold-400/20 shadow-xl"
            >
              <p className="text-gold-400 font-bold text-sm mb-3">🔥 ストリーク</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">現在</span>
                  <span className="text-white font-bold">{streak.count}日連続 {emoji}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">最高記録</span>
                  <span className="text-gold-400 font-bold">{streak.bestStreak}日</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">累計アクセス</span>
                  <span className="text-gray-300">{streak.totalDays}日</span>
                </div>
              </div>
              {streak.count >= 7 && (
                <div className="mt-3 pt-3 border-t border-gold-400/10 text-center">
                  <p className="text-xs text-gold-400">素晴らしい継続力です！</p>
                </div>
              )}
              {streak.count === 1 && (
                <div className="mt-3 pt-3 border-t border-gold-400/10 text-center">
                  <p className="text-xs text-gray-400">明日も来て連続記録を作ろう！</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
