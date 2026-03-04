'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProgressEntry, DiagnosisResult } from '@/lib/types'
import CoconalaCTA from '@/components/CoconalaCTA'
import StreakBadge from '@/components/StreakBadge'
import NotificationButton from '@/components/NotificationButton'

const COCONALA_URL = process.env.NEXT_PUBLIC_COCONALA_URL || 'https://coconala.com'

const MOOD_OPTIONS = [
  { value: 1, label: '😞', desc: '最悪' },
  { value: 2, label: '😕', desc: '微妙' },
  { value: 3, label: '😐', desc: '普通' },
  { value: 4, label: '😊', desc: '良い' },
  { value: 5, label: '🔥', desc: '最高' },
]

const WEEK_ACTIONS: Record<number, string[]> = {
  1: ['プロフィール写真を撮り直した', '身だしなみを見直した', '自己紹介文を書き直した'],
  2: ['毎日メッセージを送る習慣をつけた', 'いいねを積極的に送った', '友人に紹介を頼んだ'],
  3: ['初デートに誘った', '傾聴を意識して会話した', 'LINEを活性化させた'],
  4: ['サプライズを準備した', '深い価値観の話をした', '感情的つながりを意識した'],
}

export default function ProgressPage() {
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ week: 1, mood: 3, notes: '', completedActions: [] as string[] })
  const [planChecks, setPlanChecks] = useState<Record<string, boolean>>({})
  const router = useRouter()

  useEffect(() => {
    const dr = localStorage.getItem('diagnosis_result')
    const er = localStorage.getItem('progress_entries')
    const pc = localStorage.getItem('plan_checks')
    if (dr) setDiagnosis(JSON.parse(dr))
    if (er) setEntries(JSON.parse(er))
    if (pc) setPlanChecks(JSON.parse(pc))

    // Auto-detect current week (days since start)
    const startDate = localStorage.getItem('start_date')
    if (!startDate) {
      localStorage.setItem('start_date', new Date().toISOString())
    } else {
      const days = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000)
      const week = Math.min(Math.floor(days / 7) + 1, 4)
      setForm((f) => ({ ...f, week }))
    }
  }, [])

  const toggleAction = (action: string) => {
    setForm((f) => ({
      ...f,
      completedActions: f.completedActions.includes(action)
        ? f.completedActions.filter((a) => a !== action)
        : [...f.completedActions, action],
    }))
  }

  const saveEntry = () => {
    const entry: ProgressEntry = {
      date: new Date().toLocaleDateString('ja-JP'),
      week: form.week,
      completedActions: form.completedActions,
      notes: form.notes,
      mood: form.mood,
    }
    const next = [entry, ...entries]
    setEntries(next)
    localStorage.setItem('progress_entries', JSON.stringify(next))
    setShowForm(false)
    setForm({ week: form.week, mood: 3, notes: '', completedActions: [] })
  }

  // Stats
  const totalEntries = entries.length
  const avgMood = entries.length > 0
    ? (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1)
    : '—'
  const totalActionsCompleted = entries.reduce((s, e) => s + e.completedActions.length, 0)
  const daysActive = new Set(entries.map((e) => e.date)).size

  // Plan check overall
  const totalChecked = Object.values(planChecks).filter(Boolean).length
  const totalPossible = Object.values(WEEK_ACTIONS).flat().length
  const planProgress = totalPossible > 0 ? Math.round((totalChecked / totalPossible) * 100) : 0

  const MOOD_LABEL = { 1: '😞', 2: '😕', 3: '😐', 4: '😊', 5: '🔥' }

  return (
    <main className="min-h-screen bg-[#0A1628] pb-24">
      {/* Header */}
      <div className="glass border-b border-gold-400/10 px-5 py-5 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/plan')} className="text-gray-400 hover:text-gold-400 transition-colors text-sm">
            ← 行動計画
          </button>
          <h1 className="text-white font-bold">📊 進捗ダッシュボード</h1>
          <StreakBadge />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          {[
            { label: '記録日数', value: daysActive + '日', icon: '📅' },
            { label: '平均モチベ', value: avgMood, icon: '💫' },
            { label: '完了アクション', value: totalActionsCompleted + '個', icon: '✅' },
            { label: 'プラン達成率', value: planProgress + '%', icon: '🎯' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-4 text-center"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-300 font-medium">4週間プラン 総合進捗</span>
            <span className="text-gold-400 font-bold">{planProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-navy-700 rounded-full overflow-hidden">
            <div className="progress-bar h-full" style={{ width: `${planProgress}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {totalChecked} / {totalPossible} アクション完了
          </p>
        </motion.div>

        {/* Diagnosis type reminder */}
        {diagnosis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-4 flex items-center gap-4"
          >
            <span className="text-3xl">{diagnosis.emoji}</span>
            <div>
              <p className="text-xs text-gray-400">あなたの恋愛タイプ</p>
              <p className="text-gold-400 font-bold">{diagnosis.type}</p>
              <p className="text-xs text-gray-400 mt-0.5">{diagnosis.approach.slice(0, 50)}...</p>
            </div>
          </motion.div>
        )}

        {/* Notification button */}
        <NotificationButton compact />

        {/* Add entry button */}
        <button
          onClick={() => setShowForm(true)}
          className="btn-gold w-full py-4 rounded-2xl text-base font-bold"
        >
          ✍️ 今日の進捗を記録する
        </button>

        {/* Record form modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
              onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="glass rounded-3xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-white font-bold text-lg">今日の記録</h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {/* Week selector */}
                <div className="mb-5">
                  <p className="text-sm text-gray-300 mb-2">記録する週</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((w) => (
                      <button
                        key={w}
                        onClick={() => setForm((f) => ({ ...f, week: w, completedActions: [] }))}
                        className={`py-2 rounded-xl text-sm font-medium transition-all ${
                          form.week === w ? 'bg-gold-400/20 border border-gold-400/40 text-gold-300' : 'glass-light border-white/5 text-gray-400'
                        }`}
                      >
                        Week {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood selector */}
                <div className="mb-5">
                  <p className="text-sm text-gray-300 mb-3">今日のモチベーション・気分</p>
                  <div className="flex gap-2 justify-between">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setForm((f) => ({ ...f, mood: m.value }))}
                        className={`flex-1 py-3 rounded-xl border text-center transition-all ${
                          form.mood === m.value
                            ? 'bg-gold-400/15 border-gold-400/40'
                            : 'glass-light border-white/5'
                        }`}
                      >
                        <div className="text-xl">{m.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Completed actions */}
                <div className="mb-5">
                  <p className="text-sm text-gray-300 mb-3">今日やったこと</p>
                  <div className="space-y-2">
                    {(WEEK_ACTIONS[form.week] || []).map((action, i) => (
                      <button
                        key={i}
                        onClick={() => toggleAction(action)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all ${
                          form.completedActions.includes(action)
                            ? 'bg-gold-400/15 border-gold-400/30 text-gold-200'
                            : 'glass-light border-white/5 text-gray-300'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                          form.completedActions.includes(action) ? 'bg-gold-400' : 'border border-gray-600'
                        }`}>
                          {form.completedActions.includes(action) && <span className="text-[#0A1628] text-xs font-bold">✓</span>}
                        </span>
                        {action}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <p className="text-sm text-gray-300 mb-2">メモ・気づき（任意）</p>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="今日あったこと、感じたこと、気づきなど..."
                    rows={3}
                    className="input-luxury rounded-xl px-4 py-3 text-sm resize-none"
                  />
                </div>

                <button
                  onClick={saveEntry}
                  className="btn-gold w-full py-4 rounded-2xl font-bold"
                >
                  💾 記録を保存する
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entry history */}
        <div>
          <h2 className="text-white font-bold mb-4">📋 記録履歴</h2>
          {entries.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-gray-400 text-sm">まだ記録がありません。</p>
              <p className="text-gray-500 text-xs mt-1">毎日の記録が成功への道を作ります。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{MOOD_LABEL[entry.mood as keyof typeof MOOD_LABEL]}</span>
                      <div>
                        <p className="text-xs text-gray-400">{entry.date}</p>
                        <p className="text-xs text-gold-400 font-medium">Week {entry.week}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {entry.completedActions.length}個完了
                    </span>
                  </div>
                  {entry.completedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {entry.completedActions.map((a, ai) => (
                        <span key={ai} className="text-xs px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-400 border border-gold-400/20">
                          ✓ {a}
                        </span>
                      ))}
                    </div>
                  )}
                  {entry.notes && (
                    <p className="text-xs text-gray-400 leading-relaxed">{entry.notes}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Coconala CTA */}
        <CoconalaCTA
          message="着実に記録を重ねているあなたへ。この行動力があれば、プロコーチとの個別セッションで劇的に加速できます。3ヶ月で変化がなければ全額返金。今がそのタイミングかもしれません。"
          url={COCONALA_URL}
        />

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3 rounded-xl border border-gold-400/20 text-gray-300 text-sm hover:border-gold-400/40 transition-all"
          >
            🏠 トップへ
          </button>
          <button
            onClick={() => router.push('/strategy')}
            className="flex-1 py-3 rounded-xl border border-gold-400/20 text-gray-300 text-sm hover:border-gold-400/40 transition-all"
          >
            📊 戦略を確認
          </button>
        </div>
      </div>
    </main>
  )
}
