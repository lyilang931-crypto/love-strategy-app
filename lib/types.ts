export interface HearingData {
  // Step 1 - 基本情報
  age: string
  gender: string
  occupation: string

  // Step 2 - 趣味・ライフスタイル
  hobbies: string[]
  weekendStyle: string
  extrovertLevel: number

  // Step 3 - 出会いの場
  meetingPlaces: string[]
  snsUsage: string
  workMeetings: string

  // Step 4 - 過去の恋愛
  relationshipExperience: string
  lastRelationshipTime: string
  breakupReasons: string[]

  // Step 5 - 理想のパートナー像
  importantTraits: string[]
  dealBreakers: string
  idealRelationship: string

  // Step 6 - 現在の課題
  currentChallenges: string[]
  selfRating: number
  motivation: string
}

export interface DiagnosisResult {
  type: string
  typeEn: string
  emoji: string
  description: string
  strengths: string[]
  weaknesses: string[]
  approach: string
  scores: Record<string, number>
}

export interface LoveStrategy {
  analysis: string
  strengths: string[]
  challenges: string[]
  strategy: {
    title: string
    description: string
    shortTerm: string[]
    mediumTerm: string[]
    longTerm: string[]
  }
  weeklyPlan: WeeklyAction[]
  keyAdvice: string[]
  coachingMessage: string
}

export interface WeeklyAction {
  week: number
  theme: string
  actions: string[]
  milestone: string
}

export interface ProgressEntry {
  date: string
  week: number
  completedActions: string[]
  notes: string
  mood: number
}

export type PersonalityTypeKey = '情熱型' | '安定型' | '自由型' | '献身型' | '知性型' | '魅力型'
