'use client'

import { motion } from 'framer-motion'

interface Props {
  message: string
  url: string
  compact?: boolean
}

export default function CoconalaCTA({ message, url, compact = false }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="coconala-border rounded-3xl overflow-hidden"
    >
      <div className="bg-[#0A1628] p-6 sm:p-8">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/15 border border-gold-400/30 text-gold-400 text-xs font-bold">
            <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-gold-400" />
            プロコーチング
          </span>
          <span className="text-gray-500 text-xs">Coconala出品中</span>
        </div>

        {!compact && (
          <div className="flex items-start gap-3 mb-4">
            <span className="text-3xl flex-shrink-0 animate-float">💎</span>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                AIを超えた、<span className="gold-text">個別コーチング</span>
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
            </div>
          </div>
        )}

        {compact && (
          <p className="text-gray-300 text-sm leading-relaxed mb-4">{message}</p>
        )}

        {/* Feature badge */}
        <div className="glass rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤝</span>
            <div>
              <p className="text-gold-300 font-bold text-sm">AIツール付き・丁寧なフォローアップ</p>
              <p className="text-gray-400 text-xs mt-0.5">
                この恋愛戦略AIと組み合わせて、プロコーチが個別に伴走サポートします。
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        {!compact && (
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              '✓ 週1回のマンツーマンセッション',
              '✓ LINEでの随時相談対応',
              '✓ 状況別の即時アドバイス',
              '✓ メンタルサポート付き',
            ].map((feat, i) => (
              <div key={i} className="text-xs text-gray-300 flex items-center gap-1.5">
                <span className="text-gold-400 flex-shrink-0">{feat.split(' ')[0]}</span>
                <span>{feat.split(' ').slice(1).join(' ')}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold block text-center py-4 rounded-2xl font-bold text-base tracking-wide no-underline animate-pulse-gold"
        >
          💎 プロコーチングを詳しく見る →
        </a>
        <p className="text-center text-gray-500 text-xs mt-2">
          Coconalaで安全・安心に決済できます
        </p>
      </div>
    </motion.div>
  )
}
