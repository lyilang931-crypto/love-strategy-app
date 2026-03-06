'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const FEATURES = [
  {
    icon: '🎯',
    title: '徹底ヒアリング',
    desc: '職業・趣味・出会いの場・過去の恋愛など6つのテーマで深掘り分析。あなたの恋愛パターンを科学的に解明します。',
  },
  {
    icon: '🧬',
    title: 'AI性格診断',
    desc: '独自アルゴリズムがあなたの恋愛タイプを6種類から精密に分類。なぜ今まで上手くいかなかったかが明確になります。',
  },
  {
    icon: '📊',
    title: 'オーダーメイド戦略',
    desc: 'Gemini AIがあなた専用の恋愛戦略と4週間の行動計画を生成。具体的なアクションで迷いなく動けます。',
  },
]

const STEPS = [
  { num: '01', title: 'ヒアリング', desc: '6つのテーマで深掘り（約10分）', href: '/hearing' },
  { num: '02', title: 'AI性格診断', desc: '12問で恋愛タイプを特定', href: '/diagnosis' },
  { num: '03', title: '戦略生成', desc: 'AIがあなた専用プランを作成', href: '/strategy' },
  { num: '04', title: '実践・記録', desc: '週次で進捗を管理しながら前進', href: '/progress' },
]


const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

// Star の型
interface StarData {
  id: number
  size: number
  x: number
  y: number
  dur: number
  delay: number
  opacity: number
}

// Star particle component
// Math.random() はクライアントサイドの useEffect 内でのみ生成。
// SSR とクライアントのハイドレーション不一致（Hydration Error）を防ぐため。
function Stars() {
  const [stars, setStars] = useState<StarData[] | null>(null)

  useEffect(() => {
    setStars(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        size: Math.random() * 2.5 + 0.5,
        x: Math.random() * 100,
        y: Math.random() * 100,
        dur: Math.random() * 8 + 5,
        delay: Math.random() * 6,
        opacity: Math.random() * 0.2 + 0.05,
      }))
    )
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* SSR時は stars が null のため何も描画しない（Hydration mismatch 防止）*/}
      {stars?.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-gold-400"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top: `${s.y}%`,
            opacity: s.opacity,
            animation: `float ${s.dur}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
      {/* Large glow orbs（固定値なので SSR でも安全）*/}
      <div
        className="absolute w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
          top: '10%',
          right: '-10%',
          animation: 'float 10s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)',
          bottom: '20%',
          left: '-5%',
          animation: 'float 12s ease-in-out infinite',
          animationDelay: '3s',
        }}
      />
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0A1628] overflow-x-hidden">
      <Stars />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 py-24 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass text-gold-400 text-sm font-medium tracking-wider">
            ✨ AIが導く、あなただけの恋愛戦略
          </span>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
          className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 max-w-3xl"
        >
          <span className="gold-text">理想の恋人</span>を<br />
          <span className="text-white">科学的に</span>引き寄せる
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
          className="text-gray-300 text-base sm:text-lg leading-relaxed mb-10 max-w-xl"
        >
          AIがあなたの恋愛パターンを徹底分析。<br />
          その人だけの戦略と行動計画で、3ヶ月で理想の恋人を目指せる。
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <Link href="/hearing">
            <button className="btn-gold px-10 py-4 rounded-full text-lg font-bold tracking-wide animate-pulse-gold">
              無料で戦略を作る →
            </button>
          </Link>
          <span className="text-gray-500 text-sm">登録不要 · 約15分 · 完全無料</span>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-gray-600 text-xs tracking-widest uppercase">scroll</span>
          <div className="w-0.5 h-8 bg-gradient-to-b from-gold-400/50 to-transparent" />
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-5 py-20 max-w-5xl mx-auto">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center text-3xl font-bold mb-4"
        >
          <span className="gold-text">3つの特徴</span>
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={1}
          variants={fadeUp}
          className="text-center text-gray-400 mb-14 text-sm"
        >
          感情論ではなく、データと戦略で恋愛を攻略する
        </motion.p>

        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="glass rounded-2xl p-7 card-hover"
            >
              <div className="text-4xl mb-4 animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-gold-300 mb-3">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-5 py-20 bg-[#060E1A]/60">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center text-3xl font-bold mb-14"
          >
            <span className="gold-text">4ステップ</span>で理想の恋愛へ
          </motion.h2>

          <div className="space-y-5">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <Link href={s.href}>
                  <div className="glass rounded-2xl p-6 flex items-center gap-6 card-hover cursor-pointer group">
                    <div className="flex-shrink-0">
                      <span
                        className="text-4xl font-bold font-display"
                        style={{ color: `rgba(212,175,55,${0.2 + i * 0.2})` }}
                      >
                        {s.num}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{s.title}</h3>
                      <p className="text-gray-400 text-sm">{s.desc}</p>
                    </div>
                    <div className="ml-auto flex-shrink-0">
                      <div className="w-8 h-8 rounded-full border border-gold-400/30 flex items-center justify-center text-gold-400 text-sm group-hover:bg-gold-400/20 group-hover:border-gold-400/60 transition-all">
                        →
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-5 py-24 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="glass rounded-3xl p-10 sm:p-14 max-w-2xl mx-auto coconala-border"
        >
          <div className="text-5xl mb-6 animate-float">💫</div>
          <h2 className="text-3xl font-bold mb-4">
            まず、<span className="gold-text">無料で試してみる</span>
          </h2>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-8">
            登録不要・約15分で、あなただけの恋愛戦略が手に入ります。
          </p>
          <Link href="/hearing">
            <button className="btn-gold px-12 py-4 rounded-full text-lg font-bold tracking-wide animate-pulse-gold">
              無料で恋愛戦略を作る →
            </button>
          </Link>
          <p className="text-gray-600 text-xs mt-4">登録不要 · スマホで完結 · 完全無料</p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold-400/10 py-8 text-center">
        <p className="text-gray-600 text-xs">
          © 2026 恋愛戦略AI · Powered by Gemini AI
        </p>
      </footer>
    </main>
  )
}
