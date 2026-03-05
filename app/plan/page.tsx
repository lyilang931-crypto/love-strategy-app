'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { WeeklyAction } from '@/lib/types'
import CoconalaCTA from '@/components/CoconalaCTA'
import StreakBadge from '@/components/StreakBadge'
import NotificationButton from '@/components/NotificationButton'

const COCONALA_URL = process.env.NEXT_PUBLIC_COCONALA_URL || 'https://coconala.com/services/4107500'

const WEEK_COLORS = [
  { border: 'border-gold-400/40', bg: 'bg-gold-400/10', text: 'text-gold-300' },
  { border: 'border-blue-400/40', bg: 'bg-blue-400/10', text: 'text-blue-300' },
  { border: 'border-purple-400/40', bg: 'bg-purple-400/10', text: 'text-purple-300' },
  { border: 'border-pink-400/40', bg: 'bg-pink-400/10', text: 'text-pink-300' },
]

interface CheckState {
  [weekAction: string]: boolean
}

export default function PlanPage() {
  const [plan, setPlan] = useState<WeeklyAction[]>([])
  const [checks, setChecks] = useState<CheckState>({})
  const [activeWeek, setActiveWeek] = useState(1)
  const [loaded, setLoaded] = useState(false)
  const [nickname, setNickname] = useState('')
  const router = useRouter()

  useEffect(() => {
    const planRaw = localStorage.getItem('weekly_plan')
    const checksRaw = localStorage.getItem('plan_checks')
    if (!planRaw) { router.push('/strategy'); return }
    setPlan(JSON.parse(planRaw))
    if (checksRaw) setChecks(JSON.parse(checksRaw))
    setNickname(localStorage.getItem('user_nickname') || '')
    setLoaded(true)
  }, [router])

  const toggleCheck = (key: string) => {
    const next = { ...checks, [key]: !checks[key] }
    setChecks(next)
    localStorage.setItem('plan_checks', JSON.stringify(next))
  }

  const getWeekProgress = (week: number) => {
    const w = plan.find((p) => p.week === week)
    if (!w) return 0
    const done = w.actions.filter((_, i) => checks[`${week}-${i}`]).length
    return Math.round((done / w.actions.length) * 100)
  }

  const totalProgress = plan.length > 0
    ? Math.round(
        plan.reduce((sum, w) => sum + getWeekProgress(w.week), 0) / plan.length
      )
    : 0

  if (!loaded) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gold-400">読み込み中...</div>
    </div>
  )

  const activeWeekData = plan.find((p) => p.week === activeWeek)
  const wc = WEEK_COLORS[(activeWeek - 1) % 4]

  return (
    <main className="min-h-screen bg-[#0A1628] pb-20">
      {/* Header */}
      <div className="glass border-b border-gold-400/10 px-5 py-5 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/strategy')} className="text-gray-400 hover:text-gold-400 transition-colors text-sm">
              ← 戦略に戻る
            </button>
            <StreakBadge />
            <button onClick={() => router.push('/progress')} className="text-gold-400 text-sm font-medium">
              進捗記録 →
            </button>
          </div>
          {nickname && (
            <p className="text-xs text-gold-400/70 text-center mt-2">
              こんにちは、{nickname}さん 💕
            </p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-6">

        {/* Overall progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 text-center"
        >
          <p className="text-gray-400 text-xs mb-3 tracking-widest uppercase">4週間プラン 達成率</p>
          <div className="relative w-28 h-28 mx-auto mb-4">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="#D4AF37" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${totalProgress * 2.51} 251`}
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{totalProgress}%</span>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            {plan.map((w) => {
              const pct = getWeekProgress(w.week)
              const c = WEEK_COLORS[(w.week - 1) % 4]
              return (
                <div key={w.week} className="text-center">
                  <div className={`text-xs font-bold ${c.text}`}>W{w.week}</div>
                  <div className="text-xs text-gray-400">{pct}%</div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Week selector */}
        <div className="grid grid-cols-4 gap-2">
          {plan.map((w) => {
            const pct = getWeekProgress(w.week)
            const c = WEEK_COLORS[(w.week - 1) % 4]
            const isActive = activeWeek === w.week
            return (
              <button
                key={w.week}
                onClick={() => setActiveWeek(w.week)}
                className={`rounded-xl p-3 border transition-all duration-200 text-center ${
                  isActive
                    ? `${c.bg} ${c.border} ${c.text}`
                    : 'glass border-white/5 text-gray-400 hover:border-gold-400/20'
                }`}
              >
                <div className="text-xs font-bold mb-1">Week {w.week}</div>
                <div className="text-xs">{pct}%</div>
              </button>
            )
          })}
        </div>

        {/* Active week detail */}
        <AnimatePresence mode="wait">
          {activeWeekData && (
            <motion.div
              key={activeWeek}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className={`glass rounded-2xl p-6 border ${wc.border}`}
            >
              <div className="mb-5">
                <p className={`text-xs font-bold tracking-widest uppercase ${wc.text} mb-1`}>
                  Week {activeWeekData.week}
                </p>
                <h2 className="text-lg font-bold text-white">{activeWeekData.theme}</h2>
              </div>

              {/* Actions checklist */}
              <div className="space-y-3 mb-6">
                {activeWeekData.actions.map((action, i) => {
                  const key = `${activeWeek}-${i}`
                  const done = checks[key]
                  return (
                    <button
                      key={i}
                      onClick={() => toggleCheck(key)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${
                        done
                          ? 'bg-gold-400/10 border-gold-400/30'
                          : 'glass-light border-white/5 hover:border-gold-400/20'
                      }`}
                    >
                      <span className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                        done ? 'bg-gold-400' : 'border border-gray-600'
                      }`}>
                        {done && <span className="text-[#0A1628] text-xs font-bold">✓</span>}
                      </span>
                      <span className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                        {action}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Milestone */}
              <div className={`${wc.bg} border ${wc.border} rounded-xl p-4`}>
                <p className={`text-xs font-bold ${wc.text} mb-1`}>🎯 この週のマイルストーン</p>
                <p className="text-sm text-gray-200">{activeWeekData.milestone}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation between weeks */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveWeek((w) => Math.max(w - 1, 1))}
            disabled={activeWeek === 1}
            className="flex-1 py-3 rounded-xl border border-gold-400/20 text-gray-300 text-sm disabled:opacity-30 hover:border-gold-400/40 transition-all"
          >
            ← 前の週
          </button>
          <button
            onClick={() => setActiveWeek((w) => Math.min(w + 1, plan.length))}
            disabled={activeWeek === plan.length}
            className="flex-1 py-3 rounded-xl border border-gold-400/20 text-gray-300 text-sm disabled:opacity-30 hover:border-gold-400/40 transition-all"
          >
            次の週 →
          </button>
        </div>

        {/* Push notification toggle */}
        <NotificationButton />

        {/* LINE 公式アカウント 友だち追加 */}
        <motion.a
          href="https://lin.ee/sCZfq8S"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 glass rounded-2xl p-5 border border-[#00B900]/30 hover:border-[#00B900]/60 hover:bg-[#00B900]/5 active:scale-95 transition-all duration-200 group"
        >
          {/* LINE アイコン */}
          <div className="w-12 h-12 rounded-2xl bg-[#00B900] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#00B900]/20">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
          </div>

          {/* テキスト */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">📩 LINEで毎日リマインダーを受け取る</p>
            <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
              公式LINEに友だち追加すると、毎日リマインダーや恋愛アドバイスが届きます
            </p>
          </div>

          {/* 矢印 */}
          <span className="text-[#00B900] text-lg group-hover:translate-x-0.5 transition-transform flex-shrink-0">→</span>
        </motion.a>

        {/* Progress recording CTA */}
        <button
          onClick={() => router.push('/progress')}
          className="btn-gold w-full py-4 rounded-2xl text-base font-bold"
        >
          📊 進捗を記録する →
        </button>

        {/* Coconala CTA */}
        <CoconalaCTA
          message="行動計画を実践している中で「この状況はどうすれば？」という疑問が出てきたら、個別コーチングで即座に解決できます。3ヶ月保証付きで、プロコーチがあなたの恋愛を全力サポートします。"
          url={COCONALA_URL}
          compact
        />
      </div>
    </main>
  )
}
