import type { Metadata, Viewport } from 'next'
import { Noto_Serif_JP, Playfair_Display } from 'next/font/google'
import './globals.css'

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
    'AIが徹底的にヒアリングし、あなただけの恋愛戦略を提案。科学的アプローチで3ヶ月以内に理想の恋人を。',
  openGraph: {
    title: '恋愛戦略AI',
    description: 'AIが導く、あなただけの恋愛戦略',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${notoSerif.variable} ${playfair.variable}`}>
      <body className="bg-[#0A1628] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
