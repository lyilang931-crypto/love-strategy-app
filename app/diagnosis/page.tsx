'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { DiagnosisResult } from '@/lib/types'
import ShareModal from '@/components/ShareModal'

// ── Personality types ──
const TYPES = {
  情熱型: {
    emoji: '🔥',
    typeEn: 'Passionate',
    description: '感情豊かで行動力があり、恋愛に全力投球するタイプ。好きになったら一直線で、相手をときめかせる力が抜群。ただし感情が先走りがちで、ペース配分が課題。',
    strengths: ['行動力・決断力が高い', '感情表現が豊か', '相手をときめかせる情熱', '一途で誠実'],
    weaknesses: ['感情的になりすぎることも', '焦りやすく空回りしがち', '失恋後のダメージが大きい'],
    approach: '情熱を武器にしながら、戦略的な「間」を意識する。感情を表現しつつも、相手のペースを尊重する姿勢が鍵。',
  },
  安定型: {
    emoji: '🛡️',
    typeEn: 'Stable',
    description: '慎重で安心感を与えることが得意なタイプ。信頼を積み重ねながら深い絆を築く。ただし動き出しが遅く、チャンスを逃しやすい傾向がある。',
    strengths: ['信頼感・安心感がある', '長期的な関係を育てる力', '誠実さと包容力', '安定した精神力'],
    weaknesses: ['アプローチが遅くなりがち', '積極性が出にくい', 'リスクを嫌い機会損失しやすい'],
    approach: '持ち前の信頼感を前面に出しながら、小さなアクションを積み重ねる「接触回数の最大化」戦略が効果的。',
  },
  自由型: {
    emoji: '🌊',
    typeEn: 'Free Spirit',
    description: '独立心が強く、束縛を嫌うタイプ。自分らしさを大切にしながら恋愛するが、相手に壁を作りがちで、なかなか心を開けないことが課題。',
    strengths: ['独自の魅力・個性がある', '自立していてかっこいい', '自分の世界観を持っている', 'ユニークな価値観'],
    weaknesses: ['距離感を縮めるのが苦手', '感情を閉じてしまいがち', '相手を不安にさせることも'],
    approach: '個性という最大の武器を活かしつつ、「自己開示の練習」から始める。少しずつ内面を見せることで相手の心を引き寄せる。',
  },
  献身型: {
    emoji: '💝',
    typeEn: 'Devoted',
    description: '思いやりが深く、相手を幸せにすることに喜びを感じるタイプ。ただし自分を後回しにしすぎて、相手に重く見られたり、都合良く扱われるリスクがある。',
    strengths: ['思いやりと優しさが際立つ', '相手の気持ちを汲み取る力', 'サポート力が高い', '献身的な愛情'],
    weaknesses: ['自己犠牲しすぎる', '価値を下げてしまうことも', '断れず振り回されがち'],
    approach: '優しさという最高の武器を活かしつつ、「自分の価値を高める行動」と「断る練習」で相手に大切にされる関係を作る。',
  },
  知性型: {
    emoji: '🎓',
    typeEn: 'Intellectual',
    description: '論理的で知的な会話を好むタイプ。深い話ができるパートナーを求め、表面的な関係に満足できない。感情より頭で考えすぎてタイミングを逃しがち。',
    strengths: ['知的な会話力が魅力', '深い関係を作れる', '相手をリスペクトした接し方', '誠実で一貫性がある'],
    weaknesses: ['考えすぎて動けないことも', '感情表現が少なく見える', '相手に「難しい人」と思われることも'],
    approach: '知性という武器を会話で存分に発揮しながら、「感情ファースト」の練習をする。頭より先に心を動かすことで関係が加速する。',
  },
  魅力型: {
    emoji: '✨',
    typeEn: 'Charming',
    description: '外向的で社交性が高く、場の空気を明るくするタイプ。広い交友関係を持つが、深い関係に進みにくかったり、誰にでも優しいために好意が伝わりにくいことがある。',
    strengths: ['社交性・コミュ力が高い', '場の雰囲気を作るのがうまい', '友好関係の広さ', '初対面での好印象力'],
    weaknesses: ['特定の人への好意が伝わりにくい', '広く浅くになりがち', '「いい人止まり」になることも'],
    approach: '広い人脈を活かしながら、「特定の人への集中アプローチ」と「差別化した行動」で、いい人を超えた存在になる戦略を取る。',
  },
}

// ── Quiz questions ──
const QUESTIONS = [
  {
    q: '気になる人ができたとき、最初の行動は？',
    options: [
      { label: 'すぐに声をかける・連絡する', type: '情熱型' },
      { label: 'タイミングを慎重に計る', type: '安定型' },
      { label: '自分のペースで自然に近づく', type: '自由型' },
      { label: '相手が喜ぶことを先に考える', type: '献身型' },
    ],
  },
  {
    q: '理想のデートに近いのは？',
    options: [
      { label: '夜景が見えるレストランで熱い会話', type: '情熱型' },
      { label: 'お互いの家でゆっくり映画鑑賞', type: '安定型' },
      { label: '突然決めた旅行・非日常の体験', type: '自由型' },
      { label: '相手の好きな場所・したいことに合わせる', type: '献身型' },
    ],
  },
  {
    q: '友人から「あなたってどんな人？」と聞かれたら？',
    options: [
      { label: '情熱的・エネルギッシュと言われる', type: '情熱型' },
      { label: '信頼できる・落ち着いていると言われる', type: '安定型' },
      { label: '個性的・マイペースと言われる', type: '自由型' },
      { label: '優しい・頼りになると言われる', type: '献身型' },
    ],
  },
  {
    q: '好きな人と話すとき、一番大切にしていることは？',
    options: [
      { label: '自分の気持ちを正直にぶつけること', type: '情熱型' },
      { label: '相手の話をじっくり聞くこと', type: '安定型' },
      { label: '自分らしさを失わないこと', type: '自由型' },
      { label: '相手が心地よく話せる雰囲気を作ること', type: '献身型' },
    ],
  },
  {
    q: '恋愛で一番得意なことは？',
    options: [
      { label: '相手をドキドキさせること', type: '魅力型' },
      { label: '安心感を与えること', type: '安定型' },
      { label: '深い話をすること', type: '知性型' },
      { label: '相手を気遣い、サポートすること', type: '献身型' },
    ],
  },
  {
    q: '恋愛でよくある「自分の失敗パターン」は？',
    options: [
      { label: '感情的になりすぎる', type: '情熱型' },
      { label: '動き出すのが遅くてチャンスを逃す', type: '安定型' },
      { label: '相手に心を開くのに時間がかかる', type: '自由型' },
      { label: '尽くしすぎて都合良く扱われる', type: '献身型' },
    ],
  },
  {
    q: '週末に何もない休日、あなたは？',
    options: [
      { label: '友人・知人に連絡して何か企画する', type: '魅力型' },
      { label: '自分の時間を楽しむ・趣味に没頭', type: '自由型' },
      { label: '本を読んだり学んだりして過ごす', type: '知性型' },
      { label: '誰かのために何かしたいと思う', type: '献身型' },
    ],
  },
  {
    q: '初対面の人と話すとき、あなたは？',
    options: [
      { label: '自然にリードして盛り上げられる', type: '魅力型' },
      { label: 'ゆっくり相手を観察してから話す', type: '安定型' },
      { label: '深いテーマにすぐ踏み込みたくなる', type: '知性型' },
      { label: '相手が話しやすいよう聞き役になる', type: '献身型' },
    ],
  },
  {
    q: '告白するとしたら？',
    options: [
      { label: '気持ちが溢れたら迷わず伝える', type: '情熱型' },
      { label: '相手の気持ちを確認してから慎重に', type: '安定型' },
      { label: 'ムードが合ったタイミングで自然に', type: '自由型' },
      { label: '相手がどうすれば幸せかを考えてから', type: '献身型' },
    ],
  },
  {
    q: '恋愛において、あなたが一番重視することは？',
    options: [
      { label: 'ときめき・情熱・ドキドキ感', type: '情熱型' },
      { label: '安定・信頼・一緒にいて落ち着く感覚', type: '安定型' },
      { label: '知的な刺激・価値観の共有', type: '知性型' },
      { label: '自由・お互いの個性を尊重', type: '自由型' },
    ],
  },
  {
    q: '恋人と喧嘩したとき、あなたは？',
    options: [
      { label: 'その場で感情をぶつけて解決したい', type: '情熱型' },
      { label: 'お互いが落ち着いてから話し合いたい', type: '安定型' },
      { label: '一人で冷静に考える時間が必要', type: '自由型' },
      { label: 'まず相手の気持ちを全部聞きたい', type: '献身型' },
    ],
  },
  {
    q: 'あなたが異性から言われて嬉しいのは？',
    options: [
      { label: '「一緒にいると楽しい！元気もらえる」', type: '魅力型' },
      { label: '「あなたといると安心する・落ち着く」', type: '安定型' },
      { label: '「あなたと話すといつも新しい発見がある」', type: '知性型' },
      { label: '「あなたほど優しい人に出会ったことがない」', type: '献身型' },
    ],
  },
]

type TypeKey = keyof typeof TYPES

function calcResult(answers: string[]): DiagnosisResult {
  const scores: Record<string, number> = {}
  Object.keys(TYPES).forEach((k) => (scores[k] = 0))
  answers.forEach((a) => { if (a in scores) scores[a]++ })
  const topType = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as TypeKey
  const t = TYPES[topType]
  return {
    type: topType,
    typeEn: t.typeEn,
    emoji: t.emoji,
    description: t.description,
    strengths: t.strengths,
    weaknesses: t.weaknesses,
    approach: t.approach,
    scores,
  }
}

export default function DiagnosisPage() {
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [dir, setDir] = useState(1)
  const [showShare, setShowShare] = useState(false)
  const [nickname, setNickname] = useState('')
  const router = useRouter()

  useEffect(() => {
    setNickname(localStorage.getItem('user_nickname') || '')
  }, [])

  const choose = (type: string) => setSelected(type)

  const goNext = () => {
    if (!selected) return
    const newAnswers = [...answers, selected]
    setAnswers(newAnswers)
    setSelected(null)
    if (qIndex + 1 >= QUESTIONS.length) {
      const r = calcResult(newAnswers)
      setResult(r)
      localStorage.setItem('diagnosis_result', JSON.stringify(r))
    } else {
      setDir(1)
      setQIndex((i) => i + 1)
    }
  }

  const goToStrategy = () => router.push('/strategy')

  const slideVariants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 50 : -50 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -50 : 50 }),
  }

  if (result) {
    return (
      <main className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-start px-5 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-lg"
        >
          {/* Result header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="text-7xl mb-4 inline-block animate-float"
            >
              {result.emoji}
            </motion.div>
            {nickname && (
              <p className="text-gold-400/70 text-xs mb-1">{nickname}さんの診断結果</p>
            )}
            <p className="text-gold-400 text-sm tracking-widest uppercase mb-2">あなたの恋愛タイプは</p>
            <h1 className="text-4xl font-bold text-white mb-1">
              <span className="gold-text">{result.type}</span>
            </h1>
            <p className="text-gray-400 text-sm">{result.typeEn}</p>
          </div>

          {/* Description card */}
          <div className="glass rounded-2xl p-6 mb-5 card-hover">
            <p className="text-gray-200 text-sm leading-relaxed">{result.description}</p>
          </div>

          {/* Strengths */}
          <div className="glass rounded-2xl p-5 mb-4">
            <h3 className="text-gold-400 font-bold text-sm mb-3 flex items-center gap-2">
              <span>💪</span> あなたの強み
            </h3>
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-2 text-sm text-gray-200"
                >
                  <span className="text-gold-400 flex-shrink-0">✓</span> {s}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="glass rounded-2xl p-5 mb-4">
            <h3 className="text-gray-400 font-bold text-sm mb-3 flex items-center gap-2">
              <span>⚠️</span> 克服すべき課題
            </h3>
            <ul className="space-y-2">
              {result.weaknesses.map((w, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <span className="text-red-400 flex-shrink-0">•</span> {w}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Approach hint */}
          <div className="glass rounded-2xl p-5 mb-8 border border-gold-400/20">
            <h3 className="text-gold-300 font-bold text-sm mb-2">🎯 あなたへの戦略ヒント</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{result.approach}</p>
          </div>

          {/* シェアボタン */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            onClick={() => setShowShare(true)}
            className="w-full mb-4 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border border-gold-400/40 text-gold-300 hover:bg-gold-400/10 active:scale-95 transition-all"
          >
            <span>📤</span>
            <span>診断結果をシェアする</span>
            <span className="text-xs text-gold-400/60 ml-1">LINE・X・画像保存</span>
          </motion.button>

          <button
            onClick={goToStrategy}
            className="btn-gold w-full py-4 rounded-2xl text-base font-bold animate-pulse-gold"
          >
            🚀 あなた専用の恋愛戦略を見る →
          </button>
          <p className="text-center text-gray-500 text-xs mt-3">AIがヒアリング内容と組み合わせて完全個別プランを作成します</p>
        </motion.div>

        {/* シェアモーダル */}
        <AnimatePresence>
          {showShare && (
            <ShareModal
              result={result}
              nickname={nickname}
              onClose={() => setShowShare(false)}
            />
          )}
        </AnimatePresence>
      </main>
    )
  }

  const q = QUESTIONS[qIndex]
  const progress = ((qIndex) / QUESTIONS.length) * 100

  return (
    <main className="min-h-screen bg-[#0A1628] flex flex-col">
      {/* Header */}
      <div className="glass border-b border-gold-400/10 px-5 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gold-400 text-sm font-bold">🧬 性格診断</span>
            <span className="text-gray-400 text-sm">{qIndex + 1} / {QUESTIONS.length}</span>
          </div>
          <div className="w-full h-1.5 bg-navy-800 rounded-full overflow-hidden">
            <div className="progress-bar h-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-5 py-8 max-w-lg mx-auto w-full">
        <AnimatePresence custom={dir} mode="wait">
          <motion.div
            key={qIndex}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-1"
          >
            <div className="mb-8">
              <p className="text-gold-400 text-xs tracking-widest uppercase mb-3">Question {qIndex + 1}</p>
              <h2 className="text-xl font-bold text-white leading-relaxed">{q.q}</h2>
            </div>

            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => choose(opt.type)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                    selected === opt.type
                      ? 'bg-gold-400/20 border-gold-400 text-gold-200'
                      : 'glass border-white/8 text-gray-200 hover:border-gold-400/30 hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-start gap-3">
                    <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      selected === opt.type ? 'border-gold-400 bg-gold-400' : 'border-gray-600'
                    }`}>
                      {selected === opt.type && <span className="w-2 h-2 rounded-full bg-[#0A1628]" />}
                    </span>
                    <span className="text-sm leading-relaxed">{opt.label}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-5 py-6 max-w-lg mx-auto w-full">
        <button
          onClick={goNext}
          disabled={!selected}
          className={`w-full py-4 rounded-2xl text-base font-bold transition-all duration-300 ${
            selected ? 'btn-gold' : 'bg-navy-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {qIndex + 1 === QUESTIONS.length ? '✨ 診断結果を見る' : '次の質問へ →'}
        </button>
      </div>
    </main>
  )
}
