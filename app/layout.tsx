import type { Metadata, Viewport } from 'next'
import { Noto_Serif_JP, Playfair_Display } from 'next/font/google'
import './globals.css'
import InstallBanner from '@/components/InstallBanner'

const notoSerif = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '恋愛戦略AI | あなただけのAI恋愛コーチ',
  description:
    'AIが徹底的にヒアリングし、あなただけの恋愛戦略を提案。科学的アプローチで理想の恋人を目指せる。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: '恋愛戦略AI',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: '恋愛戦略AI',
    description: 'AIが導く、あなただけの恋愛戦略',
    type: 'website',
  },
  icons: {
    apple: '/apple-touch-icon.png',
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#D4AF37',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${notoSerif.variable} ${playfair.variable}`}>
      <body className="bg-[#0A1628] text-white min-h-screen antialiased">
        {children}
        <InstallBanner />
      </body>
    </html>
  )
}
