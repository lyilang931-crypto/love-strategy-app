'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { DiagnosisResult } from '@/lib/types'

interface Props {
  result: DiagnosisResult
  nickname?: string
  onClose: () => void
}

// Canvas テキスト折り返し
function wrapTextCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = []
  let current = ''
  for (const ch of text) {
    const test = current + ch
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current)
      current = ch
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

// 角丸矩形パス
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// グラデーション横線
function drawFadeLine(
  ctx: CanvasRenderingContext2D,
  x1: number, x2: number, y: number,
  colorMid: string,
) {
  const grad = ctx.createLinearGradient(x1, 0, x2, 0)
  grad.addColorStop(0, 'rgba(212,175,55,0)')
  grad.addColorStop(0.25, colorMid)
  grad.addColorStop(0.75, colorMid)
  grad.addColorStop(1, 'rgba(212,175,55,0)')
  ctx.strokeStyle = grad
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
}

export default function ShareModal({ result, nickname, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [hasWebShare, setHasWebShare] = useState(false)

  useEffect(() => {
    setHasWebShare(typeof navigator !== 'undefined' && !!navigator.share)
  }, [])

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 1080
    const H = 1080
    const GOLD = '#D4AF37'
    const GOLD_ALPHA = 'rgba(212,175,55,'
    const FONT = '"Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", "Noto Serif JP", serif'

    // ── 背景 ──
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#0A1628')
    bg.addColorStop(0.55, '#0d2040')
    bg.addColorStop(1, '#070f1e')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // センターグロー
    const glow = ctx.createRadialGradient(W / 2, H * 0.36, 0, W / 2, H * 0.36, 440)
    glow.addColorStop(0, 'rgba(212,175,55,0.10)')
    glow.addColorStop(1, 'rgba(212,175,55,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // 下部グロー
    const glowB = ctx.createRadialGradient(W / 2, H * 0.85, 0, W / 2, H * 0.85, 300)
    glowB.addColorStop(0, 'rgba(100,60,180,0.08)')
    glowB.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glowB
    ctx.fillRect(0, 0, W, H)

    // ドットパターン
    ctx.fillStyle = 'rgba(212,175,55,0.04)'
    for (let x = 60; x < W; x += 54) {
      for (let y = 60; y < H; y += 54) {
        ctx.beginPath()
        ctx.arc(x, y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // ── 外枠ボーダー ──
    const bGrad = ctx.createLinearGradient(0, 0, W, H)
    bGrad.addColorStop(0, `${GOLD_ALPHA}0.9)`)
    bGrad.addColorStop(0.5, `${GOLD_ALPHA}0.5)`)
    bGrad.addColorStop(1, `${GOLD_ALPHA}0.9)`)
    ctx.strokeStyle = bGrad
    ctx.lineWidth = 3
    roundRect(ctx, 28, 28, W - 56, H - 56, 24)
    ctx.stroke()

    ctx.strokeStyle = `${GOLD_ALPHA}0.18)`
    ctx.lineWidth = 1
    roundRect(ctx, 42, 42, W - 84, H - 84, 18)
    ctx.stroke()

    // コーナーアクセント
    const cornerSize = 28
    const corners = [
      [60, 60], [W - 60, 60], [60, H - 60], [W - 60, H - 60],
    ] as const
    ctx.fillStyle = GOLD
    corners.forEach(([cx, cy]) => {
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fill()
    })

    // ── ロゴ ──
    ctx.textAlign = 'center'
    ctx.font = `bold 38px ${FONT}`
    ctx.fillStyle = GOLD
    ctx.fillText('💕  恋愛戦略AI', W / 2, 114)

    // ロゴ下の線
    drawFadeLine(ctx, W * 0.22, W * 0.78, 140, `${GOLD_ALPHA}0.65)`)

    // ── 絵文字 ──
    ctx.font = '156px serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(result.emoji, W / 2, 308)

    // ── タイプラベル ──
    ctx.font = `28px ${FONT}`
    ctx.fillStyle = `${GOLD_ALPHA}0.82)`
    ctx.fillText('あなたの恋愛タイプ', W / 2, 376)

    // ── タイプ名（グラデーション） ──
    ctx.font = `bold 90px ${FONT}`
    const typeGrad = ctx.createLinearGradient(W * 0.25, 0, W * 0.75, 0)
    typeGrad.addColorStop(0, '#C9A227')
    typeGrad.addColorStop(0.45, '#F5E6A8')
    typeGrad.addColorStop(1, '#C9A227')
    ctx.fillStyle = typeGrad
    ctx.fillText(result.type, W / 2, 470)

    // ── TypeEn ──
    ctx.font = `30px ${FONT}`
    ctx.fillStyle = `${GOLD_ALPHA}0.62)`
    ctx.fillText(result.typeEn, W / 2, 520)

    // ── 説明文（最大2行） ──
    ctx.font = `25px ${FONT}`
    ctx.fillStyle = 'rgba(210,218,228,0.88)'
    const descLines = wrapTextCanvas(ctx, result.description, 830)
    descLines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, W / 2, 594 + i * 46)
    })

    // ── 強みセクション ──
    // 背景パネル
    ctx.fillStyle = 'rgba(212,175,55,0.06)'
    roundRect(ctx, 80, 672, W - 160, 148, 16)
    ctx.fill()
    ctx.strokeStyle = `${GOLD_ALPHA}0.18)`
    ctx.lineWidth = 1
    roundRect(ctx, 80, 672, W - 160, 148, 16)
    ctx.stroke()

    ctx.font = `bold 22px ${FONT}`
    ctx.fillStyle = `${GOLD_ALPHA}0.72)`
    ctx.textAlign = 'left'
    ctx.fillText('💪  あなたの強み', 110, 704)

    ctx.font = `26px ${FONT}`
    ctx.fillStyle = `${GOLD_ALPHA}0.92)`
    result.strengths.slice(0, 2).forEach((s, i) => {
      ctx.fillText(`✓  ${s}`, 118, 742 + i * 50)
    })

    // ── 区切り線 ──
    drawFadeLine(ctx, W * 0.07, W * 0.93, 852, `${GOLD_ALPHA}0.45)`)

    // ── CTA ──
    ctx.textAlign = 'center'
    ctx.font = `bold 26px ${FONT}`
    ctx.fillStyle = `${GOLD_ALPHA}0.85)`
    ctx.fillText('AIがあなた専用の恋愛戦略を提案します', W / 2, 908)

    ctx.font = `22px ${FONT}`
    ctx.fillStyle = 'rgba(150,162,178,0.65)'
    ctx.fillText('あなたも無料で診断してみよう', W / 2, 955)

    // ニックネーム（あれば）
    if (nickname?.trim()) {
      ctx.font = `italic 24px ${FONT}`
      ctx.fillStyle = `${GOLD_ALPHA}0.5)`
      ctx.fillText(`— ${nickname.trim()}さんの診断結果 —`, W / 2, 998)
    }

    setImageUrl(canvas.toDataURL('image/png'))
  }, [result, nickname])

  // Canvas が DOM に追加されてから描画
  useEffect(() => {
    const timer = setTimeout(generateImage, 50)
    return () => clearTimeout(timer)
  }, [generateImage])

  // ── シェアアクション ──

  const shareToLINE = () => {
    const name = nickname?.trim() ? `${nickname}の` : 'わたしの'
    const text = `${name}恋愛タイプは「${result.type}」でした！ ${result.emoji}\n恋愛戦略AIで無料診断↓`
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
        typeof window !== 'undefined' ? window.location.origin + '/diagnosis' : '',
      )}&text=${encodeURIComponent(text)}`,
      '_blank',
    )
  }

  const shareToTwitter = () => {
    const text = `恋愛戦略AIで診断したら「${result.type}」でした！${result.emoji}\n\n${result.description.slice(0, 45)}…\n\n#恋愛戦略AI #恋愛タイプ診断`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(
        typeof window !== 'undefined' ? window.location.origin + '/diagnosis' : '',
      )}`,
      '_blank',
    )
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        typeof window !== 'undefined' ? window.location.origin + '/diagnosis' : '',
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // ignore
    }
  }

  const saveImage = () => {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `love-type-${result.type}.png`
    a.click()
  }

  const webShare = async () => {
    if (!imageUrl || !navigator.share) return
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const file = new File([blob], `love-type-${result.type}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `私の恋愛タイプは「${result.type}」でした！`,
          text: result.description.slice(0, 80),
          files: [file],
        })
      } else {
        await navigator.share({
          title: `私の恋愛タイプは「${result.type}」でした！`,
          url: typeof window !== 'undefined' ? window.location.origin + '/diagnosis' : '',
        })
      }
    } catch {
      // cancelled
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#0d1f3d] border border-gold-400/20 rounded-t-3xl w-full max-w-lg px-5 pt-4 pb-10 shadow-2xl"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ドラッグハンドル */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        <h2 className="text-white font-bold text-center text-base mb-4">📤 診断結果をシェア</h2>

        {/* 画像プレビュー */}
        <div className="mx-auto mb-5" style={{ width: 264, height: 264 }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="シェア用カード"
              className="w-full h-full object-cover rounded-2xl border border-gold-400/25 shadow-lg"
            />
          ) : (
            <div className="w-full h-full rounded-2xl bg-navy-800 animate-pulse flex items-center justify-center">
              <span className="text-gray-500 text-xs">画像生成中…</span>
            </div>
          )}
        </div>

        {/* 非表示 Canvas（画像生成用） */}
        <canvas ref={canvasRef} width={1080} height={1080} className="hidden" />

        {/* LINEとTwitter */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={shareToLINE}
            className="flex items-center justify-center gap-2 bg-[#00B900] hover:bg-[#009c00] active:scale-95 text-white py-3.5 rounded-2xl font-bold text-sm transition-all"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            LINEでシェア
          </button>
          <button
            onClick={shareToTwitter}
            className="flex items-center justify-center gap-2 bg-black hover:bg-gray-900 active:scale-95 text-white py-3.5 rounded-2xl font-bold text-sm border border-white/20 transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            𝕏 でシェア
          </button>
        </div>

        {/* 画像保存・リンクコピー */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={saveImage}
            disabled={!imageUrl}
            className="flex items-center justify-center gap-1.5 glass text-gray-300 hover:text-white active:scale-95 py-3.5 rounded-2xl text-sm transition-all disabled:opacity-40"
          >
            📥 画像を保存
          </button>
          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-1.5 glass active:scale-95 py-3.5 rounded-2xl text-sm transition-all"
            style={{ color: copied ? '#D4AF37' : 'rgb(209,213,219)' }}
          >
            {copied ? '✅ コピーした！' : '🔗 リンクコピー'}
          </button>
        </div>

        {/* Web Share API（モバイル向け） */}
        {hasWebShare && (
          <button
            onClick={webShare}
            disabled={!imageUrl}
            className="w-full btn-gold py-3.5 rounded-2xl text-sm font-bold disabled:opacity-40 active:scale-95 transition-all"
          >
            📲 その他のアプリでシェア
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}
