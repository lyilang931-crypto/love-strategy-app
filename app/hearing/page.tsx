'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { HearingData } from '@/lib/types'

// ── Initial state ──
const INIT: HearingData = {
  age: '', gender: '', occupation: '',
  hobbies: [], weekendStyle: '', extrovertLevel: 5,
  meetingPlaces: [], snsUsage: '', workMeetings: '',
  relationshipExperience: '', lastRelationshipTime: '', breakupReasons: [],
  importantTraits: [], dealBreakers: '', idealRelationship: '',
  currentChallenges: [], selfRating: 5, motivation: '',
}

// ── Step meta ──
const STEP_TITLES = [
  { num: 1, label: '基本情報',     emoji: '👤' },
  { num: 2, label: '趣味・生活',   emoji: '🌿' },
  { num: 3, label: '出会いの場',   emoji: '🌍' },
  { num: 4, label: '過去の恋愛',   emoji: '💔' },
  { num: 5, label: '理想の相手',   emoji: '💫' },
  { num: 6, label: '現在の課題',   emoji: '🎯' },
]

const HOBBIES = ['スポーツ', '読書', '映画・ドラマ', '音楽', '料理', 'アウトドア', 'ゲーム', 'アート', '旅行', 'グルメ巡り', 'カフェ巡り', 'ファッション']
const MEETING_PLACES = ['職場・学校', '友人の紹介', 'マッチングアプリ', '趣味コミュニティ', '街コン・婚活', 'SNS', '習い事・スクール', 'バー・イベント']
const BREAKUP_REASONS = ['価値観の違い', '浮気・裏切り', '遠距離', '自然消滅', '仕事・生活の変化', '相手から振られた', '性格の不一致', 'タイミング']
const IMPORTANT_TRAITS = ['外見・見た目', '内面・性格', '経済力・安定性', '価値観の一致', 'ユーモア・笑い', '思いやり', '知性・会話力', '情熱・ときめき', '家族への姿勢']
const CURRENT_CHALLENGES = ['そもそも出会いがない', '告白・アプローチできない', '会話が続かない', 'モテ方がわからない', '自信・自己肯定感が低い', 'フラれやすい', '外見に自信がない', '仕事が忙しすぎる']

function CheckBox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      onClick={onChange}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
        checked
          ? 'bg-gold-400/15 border border-gold-400/40 text-gold-300'
          : 'glass-light border border-white/5 text-gray-300 hover:border-gold-400/20'
      }`}
    >
      <span className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${
        checked ? 'bg-gold-400 text-navy-900' : 'border border-gray-600'
      }`}>
        {checked && <span className="text-xs font-bold text-[#0A1628]">✓</span>}
      </span>
      <span className="text-sm">{label}</span>
    </label>
  )
}

function RadioOption({ label, value, selected, onSelect }: { label: string; value: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 text-sm ${
        selected
          ? 'bg-gold-400/15 border-gold-400/40 text-gold-300 font-medium'
          : 'glass-light border-white/5 text-gray-300 hover:border-gold-400/20'
      }`}
    >
      <span className={`inline-flex items-center gap-3`}>
        <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
          selected ? 'border-gold-400 bg-gold-400' : 'border-gray-600'
        }`} />
        {label}
      </span>
    </button>
  )
}

function LuxurySlider({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>{label}</span>
        <span className="text-gold-400 font-bold">{value} / {max}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--range-progress': `${pct}%` } as React.CSSProperties}
        className="w-full"
      />
    </div>
  )
}

// ── STEPS ──

function Step1({ data, set }: { data: HearingData; set: (d: Partial<HearingData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-300 mb-2">年齢</label>
        <select
          value={data.age}
          onChange={(e) => set({ age: e.target.value })}
          className="input-luxury rounded-xl px-4 py-3 text-sm"
        >
          <option value="">選択してください</option>
          {['20〜24歳', '25〜29歳', '30〜34歳', '35〜39歳', '40代以上'].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-3">性別</label>
        <div className="grid grid-cols-3 gap-3">
          {['男性', '女性', 'その他'].map((v) => (
            <RadioOption key={v} label={v} value={v} selected={data.gender === v} onSelect={() => set({ gender: v })} />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-2">職業</label>
        <input
          type="text"
          value={data.occupation}
          onChange={(e) => set({ occupation: e.target.value })}
          placeholder="例：会社員（営業）、フリーランス、学生 など"
          className="input-luxury rounded-xl px-4 py-3 text-sm"
        />
      </div>
    </div>
  )
}

function Step2({ data, set }: { data: HearingData; set: (d: Partial<HearingData>) => void }) {
  const toggle = (item: string) => {
    const arr = data.hobbies.includes(item)
      ? data.hobbies.filter((h) => h !== item)
      : [...data.hobbies, item]
    set({ hobbies: arr })
  }
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-300 mb-3">趣味（複数選択OK）</label>
        <div className="grid grid-cols-2 gap-2">
          {HOBBIES.map((h) => (
            <CheckBox key={h} label={h} checked={data.hobbies.includes(h)} onChange={() => toggle(h)} />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-2">週末の過ごし方</label>
        <textarea
          value={data.weekendStyle}
          onChange={(e) => set({ weekendStyle: e.target.value })}
          placeholder="例：友人と飲みに行くことが多い。最近は一人でカフェでゆっくりするのが好き。"
          rows={3}
          className="input-luxury rounded-xl px-4 py-3 text-sm resize-none"
        />
      </div>

      <LuxurySlider
        value={data.extrovertLevel}
        min={1}
        max={10}
        onChange={(v) => set({ extrovertLevel: v })}
        label="社交性レベル（1＝内向き ↔ 10＝外向き）"
      />
    </div>
  )
}

function Step3({ data, set }: { data: HearingData; set: (d: Partial<HearingData>) => void }) {
  const toggle = (item: string) => {
    const arr = data.meetingPlaces.includes(item)
      ? data.meetingPlaces.filter((p) => p !== item)
      : [...data.meetingPlaces, item]
    set({ meetingPlaces: arr })
  }
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-300 mb-3">主な出会いの場（複数選択OK）</label>
        <div className="grid grid-cols-2 gap-2">
          {MEETING_PLACES.map((p) => (
            <CheckBox key={p} label={p} checked={data.meetingPlaces.includes(p)} onChange={() => toggle(p)} />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-3">SNS活用度</label>
        <div className="space-y-2">
          {['ほぼ使わない', '月数回投稿', '週数回投稿', '毎日使用・積極的'].map((v) => (
            <RadioOption key={v} label={v} value={v} selected={data.snsUsage === v} onSelect={() => set({ snsUsage: v })} />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-3">職場・学校での出会い</label>
        <div className="space-y-2">
          {['可能性あり・積極的に行きたい', '難しいがゼロではない', 'ほぼ無理・同性ばかり'].map((v) => (
            <RadioOption key={v} label={v} value={v} selected={data.workMeetings === v} onSelect={() => set({ workMeetings: v })} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Step4({ data, set }: { data: HearingData; set: (d: Partial<HearingData>) => void }) {
  const toggle = (item: string) => {
    const arr = data.breakupReasons.includes(item)
      ? data.breakupReasons.filter((r) => r !== item)
      : [...data.breakupReasons, item]
    set({ breakupReasons: arr })
  }
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-300 mb-2">交際経験</label>
        <select
          value={data.relationshipExperience}
          onChange={(e) => set({ relationshipExperience: e.target.value })}
          className="input-luxury rounded-xl px-4 py-3 text-sm"
        >
          <option value="">選択してください</option>
          {['経験なし', '1〜2回', '3〜5回', '6回以上'].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-2">最後の恋愛から</label>
        <select
          value={data.lastRelationshipTime}
          onChange={(e) => set({ lastRelationshipTime: e.target.value })}
          className="input-luxury rounded-xl px-4 py-3 text-sm"
        >
          <option value="">選択してください</option>
          {['現在進行中', '3ヶ月未満', '3ヶ月〜1年', '1〜3年', '3年以上', '経験なし'].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-3">別れた主な理由（複数選択OK）</label>
        <div className="grid grid-cols-2 gap-2">
          {BREAKUP_REASONS.map((r) => (
            <CheckBox key={r} label={r} checked={data.breakupReasons.includes(r)} onChange={() => toggle(r)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Step5({ data, set }: { data: HearingData; set: (d: Partial<HearingData>) => void }) {
  const toggle = (item: string) => {
    const arr = data.importantTraits.includes(item)
      ? data.importantTraits.filter((t) => t !== item)
      : [...data.importantTraits, item]
    set({ importantTraits: arr })
  }
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-300 mb-3">相手に重視すること（複数選択OK）</label>
        <div className="grid grid-cols-2 gap-2">
          {IMPORTANT_TRAITS.map((t) => (
            <CheckBox key={t} label={t} checked={data.importantTraits.includes(t)} onChange={() => toggle(t)} />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-2">絶対にNGなこと</label>
        <textarea
          value={data.dealBreakers}
          onChange={(e) => set({ dealBreakers: e.target.value })}
          placeholder="例：喫煙者はNG。ギャンブル好きな人は無理。"
          rows={2}
          className="input-luxury rounded-xl px-4 py-3 text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-3">理想の関係性</label>
        <div className="space-y-2">
          {['のんびり・穏やかな交際', '情熱的・ドキドキする恋愛', '安定・結婚を見据えた関係', '自由・お互い尊重し合う関係'].map((v) => (
            <RadioOption key={v} label={v} value={v} selected={data.idealRelationship === v} onSelect={() => set({ idealRelationship: v })} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Step6({ data, set }: { data: HearingData; set: (d: Partial<HearingData>) => void }) {
  const toggle = (item: string) => {
    const arr = data.currentChallenges.includes(item)
      ? data.currentChallenges.filter((c) => c !== item)
      : [...data.currentChallenges, item]
    set({ currentChallenges: arr })
  }
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-300 mb-3">恋愛における課題（複数選択OK）</label>
        <div className="grid grid-cols-2 gap-2">
          {CURRENT_CHALLENGES.map((c) => (
            <CheckBox key={c} label={c} checked={data.currentChallenges.includes(c)} onChange={() => toggle(c)} />
          ))}
        </div>
      </div>

      <LuxurySlider
        value={data.selfRating}
        min={1}
        max={10}
        onChange={(v) => set({ selfRating: v })}
        label="恋愛に関する自己評価（1＝全く自信なし ↔ 10＝かなり自信あり）"
      />

      <div>
        <label className="block text-sm text-gray-300 mb-2">今のあなたの意気込みを教えてください</label>
        <textarea
          value={data.motivation}
          onChange={(e) => set({ motivation: e.target.value })}
          placeholder="例：今年こそ絶対に彼女を作りたい。もう一人でいるのは嫌です。何でも頑張ります。"
          rows={3}
          className="input-luxury rounded-xl px-4 py-3 text-sm resize-none"
        />
      </div>
    </div>
  )
}

// ── Main Component ──

export default function HearingPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<HearingData>(INIT)
  const [dir, setDir] = useState(1) // 1 = forward, -1 = back
  const router = useRouter()

  const setPartial = (d: Partial<HearingData>) => setData((prev) => ({ ...prev, ...d }))

  const canNext = () => {
    switch (step) {
      case 1: return data.age && data.gender && data.occupation
      case 2: return data.hobbies.length > 0 && data.weekendStyle
      case 3: return data.meetingPlaces.length > 0 && data.snsUsage
      case 4: return data.relationshipExperience && data.lastRelationshipTime
      case 5: return data.importantTraits.length > 0 && data.idealRelationship
      case 6: return data.currentChallenges.length > 0 && data.motivation
      default: return false
    }
  }

  const goNext = () => {
    if (!canNext()) return
    if (step === 6) {
      localStorage.setItem('hearing_data', JSON.stringify(data))
      router.push('/diagnosis')
      return
    }
    setDir(1)
    setStep((s) => s + 1)
  }

  const goBack = () => {
    if (step === 1) { router.push('/'); return }
    setDir(-1)
    setStep((s) => s - 1)
  }

  const progress = ((step - 1) / 6) * 100

  const stepComponents = [Step1, Step2, Step3, Step4, Step5, Step6]
  const StepComponent = stepComponents[step - 1]

  const slideVariants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  }

  return (
    <main className="min-h-screen bg-[#0A1628] flex flex-col">
      {/* Header */}
      <div className="glass border-b border-gold-400/10 px-5 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={goBack} className="text-gray-400 hover:text-gold-400 transition-colors text-sm">
              ← 戻る
            </button>
            <span className="text-gold-400 font-bold text-sm">{STEP_TITLES[step - 1].emoji} STEP {step} / 6</span>
            <span className="text-gray-500 text-xs">{Math.round(progress)}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-navy-800 rounded-full overflow-hidden">
            <div className="progress-bar h-full" style={{ width: `${((step - 1) / 6) * 100 + 100/6 * (canNext() ? 0.5 : 0)}%` }} />
          </div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="px-5 py-4 max-w-lg mx-auto w-full">
        <div className="flex gap-1.5">
          {STEP_TITLES.map((s) => (
            <div
              key={s.num}
              className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                s.num <= step ? 'bg-gold-400' : 'bg-navy-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4 max-w-lg mx-auto w-full">
        <AnimatePresence custom={dir} mode="wait">
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Step header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">
                {STEP_TITLES[step - 1].emoji} {STEP_TITLES[step - 1].label}
              </h1>
              <p className="text-gray-400 text-sm">
                {[
                  'まずはあなた自身のことを教えてください',
                  'どんな生活を送っているか教えてください',
                  '恋人と出会える場所を一緒に探しましょう',
                  '過去の経験から学べることがあります',
                  'あなたが求める理想の関係を教えてください',
                  '今の状況と意気込みを聞かせてください',
                ][step - 1]}
              </p>
            </div>

            <div className="glass rounded-2xl p-5">
              <StepComponent data={data} set={setPartial} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-6 max-w-lg mx-auto w-full">
        <button
          onClick={goNext}
          disabled={!canNext()}
          className={`w-full py-4 rounded-2xl text-base font-bold transition-all duration-300 ${
            canNext()
              ? 'btn-gold animate-pulse-gold'
              : 'bg-navy-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {step === 6 ? '🎯 性格診断へ進む →' : '次のステップへ →'}
        </button>
        {!canNext() && (
          <p className="text-center text-gray-600 text-xs mt-2">すべての項目を入力してください</p>
        )}
      </div>
    </main>
  )
}
