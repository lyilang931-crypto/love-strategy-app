// ── 連続ログインストリーク管理 ──

export interface StreakData {
  count: number        // 現在のストリーク日数
  bestStreak: number   // 過去最高ストリーク
  lastVisit: string    // 最終アクセス日 (YYYY-MM-DD)
  totalDays: number    // 累計アクセス日数
}

const STREAK_KEY = 'streak_data'

function toDateStr(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\//g, '-')
}

export function getStreak(): StreakData {
  const raw = localStorage.getItem(STREAK_KEY)
  if (!raw) return { count: 0, bestStreak: 0, lastVisit: '', totalDays: 0 }
  try {
    return JSON.parse(raw) as StreakData
  } catch {
    return { count: 0, bestStreak: 0, lastVisit: '', totalDays: 0 }
  }
}

/**
 * 本日アクセスを記録し、更新されたストリークデータを返す。
 * 1日1回だけカウントアップし、2日以上空いたらリセット。
 */
export function recordVisit(): StreakData {
  const today = toDateStr(new Date())
  const prev = getStreak()

  // 既に今日アクセス済みならそのまま返す
  if (prev.lastVisit === today) return prev

  let newCount: number
  if (!prev.lastVisit) {
    // 初回
    newCount = 1
  } else {
    const lastDate = new Date(prev.lastVisit.replace(/-/g, '/'))
    const todayDate = new Date(today.replace(/-/g, '/'))
    const diffDays = Math.round(
      (todayDate.getTime() - lastDate.getTime()) / 86400000
    )
    if (diffDays === 1) {
      // 連続
      newCount = prev.count + 1
    } else {
      // 途切れた
      newCount = 1
    }
  }

  const updated: StreakData = {
    count: newCount,
    bestStreak: Math.max(newCount, prev.bestStreak),
    lastVisit: today,
    totalDays: prev.totalDays + 1,
  }
  localStorage.setItem(STREAK_KEY, JSON.stringify(updated))
  return updated
}

/** ストリークに応じた炎の絵文字を返す */
export function getStreakEmoji(count: number): string {
  if (count >= 30) return '🏆'
  if (count >= 14) return '💎'
  if (count >= 7) return '🔥'
  if (count >= 3) return '⚡'
  return '✨'
}
