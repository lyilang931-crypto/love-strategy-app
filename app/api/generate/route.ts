import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import type { HearingData, DiagnosisResult } from '@/lib/types'

export async function POST(req: Request) {
  let hearingData: HearingData
  let diagnosisResult: DiagnosisResult

  // ── 1. リクエストのパース ──
  try {
    const body = await req.json()
    hearingData = body.hearingData
    diagnosisResult = body.diagnosisResult
    if (!hearingData || !diagnosisResult) {
      return NextResponse.json(
        { success: false, error: 'hearingData と diagnosisResult が必要です' },
        { status: 400 }
      )
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'リクエストボディの解析に失敗しました' },
      { status: 400 }
    )
  }

  // ── 2. APIキー未設定の場合はモックを返す ──
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn('[generate] GEMINI_API_KEY が未設定です。モックレスポンスを返します。')
    return NextResponse.json({
      success: true,
      data: getMockStrategy(hearingData, diagnosisResult),
      _mock: true,
    })
  }

  // ── 3. Gemini API 呼び出し ──
  let rawText = ''
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.75,
        maxOutputTokens: 2048,
      },
    })

    const prompt = buildPrompt(hearingData, diagnosisResult)
    const result = await model.generateContent(prompt)
    rawText = result.response.text()
  } catch (apiErr) {
    // API呼び出し自体が失敗した場合はモックで補完
    console.error('[generate] Gemini API エラー:', apiErr)
    return NextResponse.json({
      success: true,
      data: getMockStrategy(hearingData, diagnosisResult),
      _mock: true,
      _apiError: apiErr instanceof Error ? apiErr.message : String(apiErr),
    })
  }

  // ── 4. JSON パース（3段階フォールバック） ──
  try {
    const data = parseGeminiJson(rawText)
    return NextResponse.json({ success: true, data })
  } catch (parseErr) {
    console.error('[generate] JSONパース失敗:', parseErr, '\nraw:', rawText.slice(0, 500))
    // パース失敗時もモックで補完し、画面を壊さない
    return NextResponse.json({
      success: true,
      data: getMockStrategy(hearingData, diagnosisResult),
      _mock: true,
      _parseError: 'AI応答のパースに失敗しました。モックデータで補完しています。',
    })
  }
}

// ── JSON パース（直接 → コードブロック → 生JSON の順に試みる） ──
function parseGeminiJson(text: string): unknown {
  // ① responseMimeType: application/json のとき、直接パースできる
  try {
    return JSON.parse(text)
  } catch { /* 次を試す */ }

  // ② ```json ... ``` ブロックを抽出
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) {
    try {
      return JSON.parse(codeBlock[1].trim())
    } catch { /* 次を試す */ }
  }

  // ③ 最初の { から最後の } までを抽出
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return JSON.parse(text.slice(start, end + 1))
  }

  throw new Error('JSON が見つかりませんでした')
}

// ── プロンプト生成 ──
function buildPrompt(h: HearingData, d: DiagnosisResult): string {
  return `
あなたは世界トップクラスの恋愛コーチです。以下のユーザー情報を元に、その人だけの恋愛戦略を日本語で作成してください。

【基本情報】
- 年齢: ${h.age}
- 性別: ${h.gender}
- 職業: ${h.occupation}

【ライフスタイル】
- 趣味: ${h.hobbies.join('、') || 'なし'}
- 週末の過ごし方: ${h.weekendStyle}
- 社交性レベル: ${h.extrovertLevel}/10

【出会いの状況】
- 主な出会いの場: ${h.meetingPlaces.join('、') || 'なし'}
- SNS活用度: ${h.snsUsage}
- 職場・学校での出会い: ${h.workMeetings}

【過去の恋愛】
- 交際経験: ${h.relationshipExperience}
- 最後の恋愛から: ${h.lastRelationshipTime}
- 別れた理由: ${h.breakupReasons.join('、') || 'なし'}

【理想のパートナー】
- 重視すること: ${h.importantTraits.join('、') || 'なし'}
- 絶対NG: ${h.dealBreakers || 'なし'}
- 理想の関係性: ${h.idealRelationship}

【現在の状況・課題】
- 恋愛の課題: ${h.currentChallenges.join('、') || 'なし'}
- 自己評価: ${h.selfRating}/10
- 意気込み: ${h.motivation}

【性格タイプ診断結果】
タイプ: ${d.type}（${d.typeEn}）
強み: ${d.strengths.join('、')}
課題: ${d.weaknesses.join('、')}

以下のJSON形式のみで回答してください（説明文・マークダウン不要）：

{
  "analysis": "この人の恋愛パターンと根本課題の分析（200〜250字）",
  "strengths": ["強み1", "強み2", "強み3"],
  "challenges": ["課題1", "課題2"],
  "strategy": {
    "title": "この人だけの戦略タイトル（キャッチーに）",
    "description": "戦略概要と根拠（150〜200字）",
    "shortTerm": ["1ヶ月目の行動1", "行動2", "行動3"],
    "mediumTerm": ["2ヶ月目の行動1", "行動2", "行動3"],
    "longTerm": ["3ヶ月目の行動1", "行動2", "行動3"]
  },
  "weeklyPlan": [
    {"week": 1, "theme": "テーマ", "actions": ["行動1", "行動2", "行動3"], "milestone": "到達目標"},
    {"week": 2, "theme": "テーマ", "actions": ["行動1", "行動2", "行動3"], "milestone": "到達目標"},
    {"week": 3, "theme": "テーマ", "actions": ["行動1", "行動2", "行動3"], "milestone": "到達目標"},
    {"week": 4, "theme": "テーマ", "actions": ["行動1", "行動2", "行動3"], "milestone": "到達目標"}
  ],
  "keyAdvice": ["重要アドバイス1", "アドバイス2", "アドバイス3"],
  "coachingMessage": "有料コーチングへの自然な誘導文（150字程度）"
}
`.trim()
}

// ── モック戦略（APIキー未設定・エラー時のフォールバック） ──
function getMockStrategy(h: HearingData, d: DiagnosisResult) {
  return {
    analysis: `${d.type}のあなたは、${h.currentChallenges[0] || '出会いの少なさ'}が主な課題です。${h.occupation}という環境と${(h.hobbies.slice(0, 2).join('・')) || '趣味'}を活かすことで、自然な出会いを増やしながら魅力を最大限に発揮できます。過去のパターンを分析すると、${h.breakupReasons[0] || 'コミュニケーション'}の部分に改善の余地があります。`,
    strengths: d.strengths.slice(0, 3),
    challenges: d.weaknesses.slice(0, 2),
    strategy: {
      title: `${d.type}の魅力全開！3ヶ月で理想の恋人を作る「${h.idealRelationship || '安定'}」戦略`,
      description: `あなたの${d.type}という個性を武器に、${h.meetingPlaces[0] || 'マッチングアプリ'}を中心とした出会いを最大化。${h.importantTraits[0] || '価値観'}を重視しながら週次計画で着実に理想の関係を構築します。`,
      shortTerm: [
        `${h.meetingPlaces[0] || 'マッチングアプリ'}のプロフィールを完全リニューアルする`,
        '週1回以上、新しい人と接触する機会を意識的に作る',
        `${h.hobbies[0] || '趣味'}を通じた出会いの場に参加する`,
      ],
      mediumTerm: [
        '気になる人との2回目のデートを設定する',
        '自己開示の練習として内面的な話題を取り入れる',
        'デートプランの質を上げ、印象に残る体験を演出する',
      ],
      longTerm: [
        '交際の意思を自然な流れで伝える準備をする',
        '長期的な関係性のビジョンを相手と共有する',
        'お互いの価値観が合うか確認しながら深い絆を作る',
      ],
    },
    weeklyPlan: [
      { week: 1, theme: '土台作り・自己磨き', actions: ['プロフィール写真を撮り直す', '身だしなみを徹底的に見直す', '自己紹介文を書き直す'], milestone: '出会いの準備が整い、初めてのマッチングを得る' },
      { week: 2, theme: '接触回数を増やす', actions: ['毎日メッセージを送る習慣をつける', '気になる人に積極的にいいねをする', '友人に紹介してもらうよう頼む'], milestone: '3人以上と連絡を取り合っている状態にする' },
      { week: 3, theme: '初デートを実現する', actions: ['カジュアルなランチ・カフェデートに誘う', '相手の話を7割聞く「傾聴デート」を実践', 'LINEを事前から活性化させる'], milestone: '初デートを成功させ、2回目の約束をとりつける' },
      { week: 4, theme: '印象を深める・関係を進める', actions: ['相手の好きなものに関連するサプライズを用意', '将来観・価値観の話をする', '感情的なつながりを意識した会話をする'], milestone: '「また会いたい」と思われる特別な存在になる' },
    ],
    keyAdvice: [
      `${d.type}の強みである「${d.strengths[0] || '魅力'}」を前面に出すこと。それがあなたの最大の差別化ポイントです`,
      '行動の「量」と「質」の両方を上げる。週3回以上は恋愛に関連したアクションを取ること',
      'うまくいかない日があっても気にしない。恋愛は確率論。打席に立ち続けた人が勝ちます',
    ],
    coachingMessage: 'AIでここまで詳しく分析・提案できましたが、実際の行動での細かい修正やメンタルサポートは個別コーチングが圧倒的に効果的です。3ヶ月で変化がなければ全額返金の保証付きで、プロコーチがあなたの恋愛を伴走します。',
  }
}
