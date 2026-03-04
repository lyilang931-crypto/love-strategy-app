'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// beforeinstallprompt イベントの型
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type BannerType = 'ios' | 'android' | null



const DISMISSED_KEY = 'pwa_install_dismissed'
const DISMISSED_EXPIRY_DAYS = 7  // 7日後に再表示

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
}

function isLINEBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Line\//i.test(navigator.userAgent)
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    // iOS Safari standalone
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true) ||
    // Android / Chrome standalone
    window.matchMedia('(display-mode: standalone)').matches
  )
}

function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return false
    const ts = parseInt(raw, 10)
    const expiry = DISMISSED_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    return Date.now() - ts < expiry
  } catch {
    return false
  }
}

export default function InstallBanner() {
  const [bannerType, setBannerType] = useState<BannerType>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)
  const [isLine, setIsLine] = useState(false)

  useEffect(() => {
    // 既にインストール済み / 最近閉じた場合は表示しない
    if (isInStandaloneMode() || isDismissedRecently()) return

    setIsLine(isLINEBrowser())

    // Android: beforeinstallprompt イベントをキャッチ
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setBannerType('android')
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS Safari: beforeinstallprompt は発火しないので手動判定
    if (isIOS()) {
      // Safariかどうか（Chromeアプリ内ブラウザは除外）
      const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent)
      if (isSafari) {
        // 少し遅延してからバナーを表示（UX向上）
        const timer = setTimeout(() => setBannerType('ios'), 2000)
        return () => {
          clearTimeout(timer)
          window.removeEventListener('beforeinstallprompt', handler)
        }
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    } catch { /* ignore */ }
    setBannerType(null)
  }

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setBannerType(null)
      }
    } finally {
      setInstalling(false)
      setDeferredPrompt(null)
    }
  }

  return (
    <AnimatePresence>
      {bannerType === 'ios' && (
        <motion.div
          key="ios-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe-area-inset-bottom"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-lg mx-auto glass rounded-2xl border border-gold-400/30 p-4 shadow-2xl shadow-black/50">
            {/* 閉じるボタン */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-all"
              aria-label="閉じる"
            >
              ✕
            </button>

            <div className="flex items-start gap-3 pr-6">
              {/* アイコン */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192.png"
                alt="恋愛戦略AI"
                className="w-12 h-12 rounded-xl flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">
                  ホーム画面に追加してリマインダーを受け取る 💕
                </p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  毎日のアクションリマインダーをPWAアプリとして受け取れます
                </p>
              </div>
            </div>

            {/* iOS 手順 */}
            <div className="mt-4 bg-navy-800/60 rounded-xl p-3 space-y-2">
              <p className="text-gold-400 text-xs font-bold mb-2">📲 インストール手順</p>

              {/* LINE ブラウザ向け注意書き（常時表示、LINE環境では強調） */}
              <div className={`flex items-start gap-2 rounded-lg px-2.5 py-2 mb-1 ${
                isLine
                  ? 'bg-gold-400/15 border border-gold-400/40'
                  : 'bg-white/5'
              }`}>
                <span className="text-base flex-shrink-0 mt-0.5">💬</span>
                <p className={`text-xs leading-relaxed ${isLine ? 'text-gold-300' : 'text-gray-400'}`}>
                  <span className="font-bold">LINEから開いた場合：</span>
                  右下の <span className="inline-flex items-center px-1 py-0.5 rounded bg-white/10 text-white font-bold">…</span> →「<span className="font-bold text-white">ブラウザで開く</span>」を先にタップしてください
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gold-400/20 text-gold-400 text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                <p className="text-gray-300 text-xs">
                  画面下の <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-white text-xs">共有 <IOSShareIcon /></span> をタップ
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gold-400/20 text-gold-400 text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                <p className="text-gray-300 text-xs">
                  「<span className="text-white font-medium">ホーム画面に追加</span>」を選択
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gold-400/20 text-gold-400 text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
                <p className="text-gray-300 text-xs">右上の「追加」をタップして完了</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {bannerType === 'android' && (
        <motion.div
          key="android-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-lg mx-auto glass rounded-2xl border border-gold-400/30 p-4 shadow-2xl shadow-black/50">
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-all"
              aria-label="閉じる"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 pr-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192.png"
                alt="恋愛戦略AI"
                className="w-12 h-12 rounded-xl flex-shrink-0"
              />
              <div>
                <p className="text-white font-bold text-sm">アプリとして追加する</p>
                <p className="text-gray-400 text-xs mt-0.5">毎日のリマインダーを受け取れます 💕</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={dismiss}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition-all"
              >
                後で
              </button>
              <button
                onClick={handleAndroidInstall}
                disabled={installing}
                className="flex-1 py-2.5 rounded-xl btn-gold text-sm font-bold disabled:opacity-70"
              >
                {installing ? 'インストール中...' : '📲 ホーム画面に追加'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// iOS の共有アイコン（SVG）
function IOSShareIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
      <path d="M12 2l-4 4h3v9h2V6h3L12 2zm-6 14v4h12v-4h-2v2H8v-2H6z"/>
    </svg>
  )
}
