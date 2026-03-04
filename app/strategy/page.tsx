'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { LoveStrategy, HearingData, DiagnosisResult } from '@/lib/types'
import CoconalaCTA from '@/components/CoconalaCTA'

const COCONALA_URL = process.env.NEXT_PUBLIC_COCONALA_URL || 'https://coconala.com'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

function LoadingScreen() {
  const steps = [
    'ヒアリングデータを分析中...',
    '性格タイプを解析中...',
    '恋愛パターンを診断中...',
    'オーダーメイド戦略を生成中...',
    '週次行動計画を作成中...',
  ]
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStepIdx((i) => Math.min(i + 1, steps.length - 1)), 1200)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center px-5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        {/* Spinning gold ring */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div
            className="absolute inset-0 rounded-full border-2 border-gold-400/20"
            style={{ borderTopColor: '#D4AF37', animation: 'rotateSlow 1.5s linear infinite' }}
          />
          <div className="absolute inset-3 rounded-full border border-gold-400/10"
            style={{ borderBottomColor: '#D4AF37', animation: 'rotateSlow 2s linear infinite reverse' }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-4xl animate-float">
            🤖
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">AIが戦略を生成中</h2>
        <p className="text-gray-400 text-sm mb-8">あなただけのプランを作成しています</p>

        <div className="glass rounded-2xl px-8 py-4 max-w-xs mx-auto">
          <motion.p
            key={stepIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-gold-400 text-sm font-medium"
          >
            {steps[stepIdx]}
          </motion.p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 justify-center mt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                i <= stepIdx ? 'bg-gold-400' : 'bg-navy-700'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default function StrategyPage() {
  const [strategy, setStrategy] = useState<LoveStrategy | null>(null)
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const hearingRaw = localStorage.getItem('hearing_data')
      const diagnosisRaw = localStorage.getItem('diagnosis_result')
      if (!hearingRaw || !diagnosisRaw) {
        router.push('/hearing')
        return
      }
      const hearingData: HearingData = JSON.parse(hearingRaw)
      const diagnosisResult: DiagnosisResult = JSON.parse(diagnosisRaw)
      setDiagnosis(diagnosisResult)

      // Check cached strategy
      const cachedStrategy = localStorage.getItem('love_strategy')
      if (cachedStrategy) {
        setStrategy(JSON.parse(cachedStrategy))
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hearingData, diagnosisResult }),
        })
        const json = await res.json()
        if (json.success) {
          setStrategy(json.data)
          localStorage.setItem('love_strategy', JSON.stringify(json.data))
          localStorage.setItem('weekly_plan', JSON.stringify(json.data.weeklyPlan))
        } else {
          setError('戦略の生成に失敗しました。もう一度お試しください。')
        }
      } catch {
        setError('通信エラーが発生しました。')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [router])

  if (loading) return <LoadingScreen />
  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center glass rounded-2xl p-8 max-w-sm">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => router.push('/hearing')} className="btn-gold px-6 py-3 rounded-xl font-bold">
          最初からやり直す
        </button>
      </div>
    </div>
  )
  if (!strategy || !diagnosis) return null

  return (
    <main className="min-h-screen bg-[#0A1628] pb-20">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#060E1A] to-[#0A1628] px-5 py-14 text-center">
        <div className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.3) 0%, transparent 70%)' }} />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="inline-block px-4 py-1.5 rounded-full border border-gold-400/30 text-gold-400 text-xs tracking-widest uppercase mb-4">
            あなただけの恋愛戦略
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            <span className="gold-text">{strategy.strategy.title}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-3">
            {diagnosis.emoji} {diagnosis.type} × AI分析
          </p>
        </motion.div>
      </div>

      <div className="max-w-lg mx-auto px-5 space-y-5 mt-6">

        {/* Analysis */}
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="glass rounded-2xl p-6">
          <h2 className="text-gold-400 font-bold text-sm mb-3 flex items-center gap-2">
            <span>🔍</span> あなたの恋愛パターン分析
          </h2>
          <p className="text-gray-200 text-sm leading-relaxed">{strategy.analysis}</p>
        </motion.div>

        {/* Strengths & Challenges */}
        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4">
            <p className="text-gold-400 text-xs font-bold mb-3">💪 あなたの強み</p>
            <ul className="space-y-2">
              {strategy.strengths.map((s, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                  <span className="text-gold-400 flex-shrink-0">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-gray-400 text-xs font-bold mb-3">⚠️ 克服すべき課題</p>
            <ul className="space-y-2">
              {strategy.challenges.map((c, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                  <span className="text-red-400 flex-shrink-0">•</span> {c}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Strategy overview */}
        <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="glass rounded-2xl p-6">
          <h2 className="text-gold-400 font-bold text-sm mb-3 flex items-center gap-2">
            <span>📊</span> 戦略概要
          </h2>
          <p className="text-gray-200 text-sm leading-relaxed">{strategy.strategy.description}</p>
        </motion.div>

        {/* 3-month roadmap */}
        <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="glass rounded-2xl p-6">
          <h2 className="text-gold-400 font-bold text-sm mb-5 flex items-center gap-2">
            <span>🗓️</span> 3ヶ月ロードマップ
          </h2>
          <div className="space-y-5">
            {[
              { label: '1ヶ月目', color: 'text-gold-300', items: strategy.strategy.shortTerm },
              { label: '2ヶ月目', color: 'text-gold-400', items: strategy.strategy.mediumTerm },
              { label: '3ヶ月目', color: 'text-gold-500', items: strategy.strategy.longTerm },
            ].map((phase, pi) => (
              <div key={pi}>
                <p className={`text-xs font-bold ${phase.color} mb-2`}>{phase.label}</p>
                <ul className="space-y-1.5">
                  {phase.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-200">
                      <span className="text-gold-400 flex-shrink-0 mt-0.5">→</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Key advice */}
        <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp} className="glass rounded-2xl p-6 border border-gold-400/20">
          <h2 className="text-gold-400 font-bold text-sm mb-4 flex items-center gap-2">
            <span>⭐</span> AIが生成したアドバイス
          </h2>
          <div className="space-y-3">
            {strategy.keyAdvice.map((advice, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-gold-400 text-xs flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-gray-200 text-sm leading-relaxed">{advice}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA to plan */}
        <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
          <button
            onClick={() => router.push('/plan')}
            className="btn-gold w-full py-4 rounded-2xl text-base font-bold"
          >
            📅 週次行動計画を見る →
          </button>
        </motion.div>

        {/* Coconala CTA */}
        <motion.div initial="hidden" animate="visible" custom={6} variants={fadeUp}>
          <CoconalaCTA message={strategy.coachingMessage} url={COCONALA_URL} />
        </motion.div>
      </div>
    </main>
  )
}
