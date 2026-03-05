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
        temperature: 0.85,   // 差別化のため創造性をやや高める
        maxOutputTokens: 2500,
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

// ── 年齢グループのラベル化 ──
function getAgeGroup(age: string): string {
  const n = parseInt(age, 10)
  if (isNaN(n)) return age
  if (n < 23) return '20代前半'
  if (n < 27) return '20代中盤'
  if (n < 30) return '20代後半'
  if (n < 35) return '30代前半'
  if (n < 40) return '30代後半'
  if (n < 45) return '40代前半'
  if (n < 50) return '40代後半'
  return '50代以上'
}

// ── 社交性スコアのコンテキスト化 ──
function getSocialProfile(level: number): string {
  if (level <= 2) return '強い内向型（人疲れしやすく、1対1が得意）'
  if (level <= 4) return '内向寄り（少人数・深い関係を好む）'
  if (level <= 6) return '中間型（状況次第で内外どちらも対応可）'
  if (level <= 8) return '外向寄り（グループも苦にならず、初対面が得意）'
  return '強い外向型（積極的に場を作り、広い人脈を持つ）'
}

// ── タイプ別の差別化観点 ──
function getTypeInsight(type: string, gender: string): string {
  const gLabel = gender.includes('男') ? '男性' : gender.includes('女') ? '女性' : gender
  const insights: Record<string, string> = {
    情熱型: `情熱が空回りしやすいため「戦略的な間（ま）」が最重要。行動力はあるので、タイミングと頻度をコントロールする具体的手法を中心に組み立てること。${gLabel}の情熱型が陥りがちな「重い・急ぎすぎ」を防ぐ設計にする。`,
    安定型: `信頼感は高いが動き出しが遅く機会損失しやすい。「接触回数の最大化」と「小さなアクションの連打」が核心。${gLabel}の安定型特有の「もう少し待てば…」という先延ばし癖を崩す具体的トリガーを組み込む。`,
    自由型: `距離感を縮めるのが苦手で、壁を作りやすい。「段階的な自己開示プログラム」が最優先。${gLabel}の自由型は個性が魅力なので、その個性を失わずに心を開く練習ステップを設計する。`,
    献身型: `尽くしすぎて価値を下げるリスクが最大の課題。「自己価値の確立」と「適度な引き算」が戦略の核心。${gLabel}の献身型が「大切にされる関係」を作るための具体的な行動境界線を組み込む。`,
    知性型: `考えすぎてタイミングを逃すパターンが顕著。「感情ファースト・論理は後回し」の練習が必要。${gLabel}の知性型の会話力を最大限に活かしながら、頭より先に動く小さな習慣を設計する。`,
    魅力型: `誰にでも優しいため好意が相手に伝わらない「いい人止まり」が課題。「特定の相手への集中アプローチ」と「差別化シグナル」が核心。${gLabel}の魅力型の社交性を逆手に取った戦略を組む。`,
  }
  return insights[type] || `${type}タイプの特性を最大限に活かしながら、弱点を補う戦略を立案する。`
}

// ── プロンプト生成（差別化強化版） ──
function buildPrompt(h: HearingData, d: DiagnosisResult): string {
  const ageGroup = getAgeGroup(h.age)
  const socialProfile = getSocialProfile(h.extrovertLevel)
  const typeInsight = getTypeInsight(d.type, h.gender)
  const primaryPlace = h.meetingPlaces[0] || 'マッチングアプリ'
  const topChallenge = h.currentChallenges[0] || '出会いの少なさ'
  const topBreakup = h.breakupReasons[0] || ''
  const topTrait = d.strengths[0] || '魅力'
  const topWeakness = d.weaknesses[0] || '課題'

  return `
あなたは10,000人以上の恋愛を成功に導いてきた日本トップクラスの恋愛ストラテジストです。
以下のユーザーデータを精密に分析し、このユーザー「だけ」に有効な恋愛戦略を日本語で作成してください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 絶対厳守ルール（違反した場合は品質不合格）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【禁止事項】
✗ 「自己磨きをしましょう」「笑顔を心がけて」「積極的になって」等、誰にでも言える汎用アドバイスは一切書かない
✗ 「相手の話をよく聞く」「清潔感を大事に」等のテンプレ表現は使わない
✗ 下記のユーザーデータを参照せず、架空・一般的な内容で埋めることを禁止

【必須事項】
✓ 「${h.gender}・${ageGroup}・${d.type}タイプ・社交性${h.extrovertLevel}/10」の組み合わせにしか当てはまらない戦略にする
✓ 出会いの主戦場「${primaryPlace}」に特化した具体的な攻略法を必ず含める
✓ 最重要課題「${topChallenge}」への直接的解決策を戦略の中核に置く
✓ 過去の失敗パターン${topBreakup ? `「${topBreakup}」` : ''}が繰り返されないよう設計する
✓ ${d.type}タイプの弱点「${topWeakness}」を克服する具体的なステップを含める

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【ユーザープロフィール】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 基本属性
- 年齢/性別/職業: ${h.age}歳（${ageGroup}）/ ${h.gender} / ${h.occupation}

■ ライフスタイル
- 趣味: ${h.hobbies.join('、') || 'なし'}
- 週末の過ごし方: ${h.weekendStyle}
- 社交性: ${h.extrovertLevel}/10 → ${socialProfile}

■ 出会いの状況
- 主な出会いの場: ${h.meetingPlaces.join('、') || 'なし'}
- SNS活用度: ${h.snsUsage}
- 職場・学校での出会い: ${h.workMeetings}

■ 過去の恋愛
- 交際経験: ${h.relationshipExperience}
- 最後の恋愛: ${h.lastRelationshipTime}前
- 別れた主な理由: ${h.breakupReasons.join('、') || 'なし'}

■ 理想のパートナー
- 重視すること: ${h.importantTraits.join('、') || 'なし'}
- 絶対NG: ${h.dealBreakers || 'なし'}
- 理想の関係性: ${h.idealRelationship}

■ 現在の課題・状態
- 恋愛の課題: ${h.currentChallenges.join('、') || 'なし'}
- 自己評価: ${h.selfRating}/10
- 意気込み: ${h.motivation}

■ 性格タイプ診断
- タイプ: ${d.type}（${d.typeEn}）
- 強み: ${d.strengths.join('、')}
- 課題: ${d.weaknesses.join('、')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【${d.type}タイプへの戦略設計指針】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${typeInsight}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【差別化チェックリスト（出力前に必ず確認）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ strategy.titleは「${h.gender}・${ageGroup}・${d.type}・${topChallenge}」を反映した固有タイトルか
□ shortTermの行動は「${primaryPlace}」での具体的行動になっているか
□ weeklyPlanのactionsは「${d.type}タイプの${topTrait}」を活かした内容か
□ keyAdvice[0]は「${d.type}タイプの${topWeakness}」を直接解決するアドバイスか
□ keyAdvice[1]は「${h.gender}・${ageGroup}」特有の状況を踏まえた内容か
□ keyAdvice[2]は「${topChallenge}」という課題への根本的な考え方の転換か

以下のJSON形式のみで回答してください（余分なテキスト・マークダウンは不要）：

{
  "analysis": "このユーザー固有の恋愛パターン・根本課題・なぜ今まで上手くいかなかったかを分析。${h.gender}・${ageGroup}・${d.type}・社交性${h.extrovertLevel}/10の組み合わせから導かれる具体的な洞察を250〜300字で。汎用的な内容は禁止。",
  "strengths": ["${d.type}タイプかつ${h.gender}ならではの強み（具体的に）", "強み2（趣味・ライフスタイルから導く）", "強み3（出会い環境から見た優位点）"],
  "challenges": ["最重要課題: ${topChallenge}に対する具体的障壁", "課題2: ${d.type}の弱点が現状にどう影響しているか"],
  "strategy": {
    "title": "${h.gender}・${ageGroup}・${d.type}タイプ専用のキャッチーな戦略タイトル（他の属性・タイプには使えないもの）",
    "description": "なぜこの戦略がこのユーザーに有効なのかの根拠。${primaryPlace}・社交性${h.extrovertLevel}/10・${d.type}の特性を必ず言及しながら180〜220字で。",
    "shortTerm": ["1ヶ月目: ${primaryPlace}での具体的行動（プラットフォーム名・頻度・具体的手法まで）", "行動2: ${d.type}の弱点克服のための小さな習慣", "行動3: 社交性${h.extrovertLevel}/10に合わせた無理のない接触頻度"],
    "mediumTerm": ["2ヶ月目: 初期接触から関係深化への橋渡し行動（具体的）", "行動2: ${topChallenge}の課題を乗り越えるための次のステップ", "行動3: ${h.idealRelationship}という理想に近づくための行動"],
    "longTerm": ["3ヶ月目: 関係性を次のステージに進める具体的アクション", "行動2: ${topBreakup ? `過去の失敗「${topBreakup}」を繰り返さないための行動` : '長期的な関係を築くための価値観すり合わせ'}", "行動3: ${h.gender}・${ageGroup}として理想の交際へのクロージング"]
  },
  "weeklyPlan": [
    {"week": 1, "theme": "${d.type}の強みを使った基盤構築", "actions": ["${primaryPlace}で${d.type}の強みを活かした具体的行動", "${h.gender}として自分の価値を上げる1週間行動", "社交性${h.extrovertLevel}/10に合わせた無理のない行動"], "milestone": "${topChallenge}の解決に向けた最初の具体的成果"},
    {"week": 2, "theme": "接触頻度を高め・関係性を構築", "actions": ["週2〜3回の自然な接触を生む行動", "${d.type}タイプが苦手とする${topWeakness}を克服する練習", "${h.meetingPlaces.join('・') || 'SNS'}を活用した出会いの幅を広げる行動"], "milestone": "気になる相手と複数回の会話・交流が実現している状態"},
    {"week": 3, "theme": "特別な存在として印象を確立", "actions": ["${topTrait}という強みを相手に伝える具体的シーン作り", "${h.importantTraits[0] || '価値観'}の一致を確認するための話題・行動", "${h.gender}・${ageGroup}として「選ばれる理由」を作る行動"], "milestone": "相手から自発的に連絡が来る、または「また会いたい」という反応を得る"},
    {"week": 4, "theme": "関係性の確立・次のステップへ", "actions": ["関係を深める1対1の時間を設ける（場所・状況を具体的に）", "${h.idealRelationship}に向けて相手の気持ちを確認するアクション", "${topBreakup ? `過去の反省「${topBreakup}」を活かした関係設計` : '長期的な関係に向けた価値観の共有'}"], "milestone": "交際or継続的な関係への明確なステータスが生まれている"}
  ],
  "keyAdvice": [
    "${d.type}タイプの最大の弱点「${topWeakness}」に対する具体的・即実践可能なアドバイス（他のタイプには不要な内容）",
    "${h.gender}・${ageGroup}特有の恋愛市場での立ち位置を踏まえた戦略的アドバイス（同性・同年代との差別化）",
    "「${topChallenge}」という根本課題を解決するためのメンタル・行動両面からの転換アドバイス"
  ],
  "coachingMessage": "このユーザーの具体的状況（${d.type}・${topChallenge}）に言及しながら、AIでは解決しきれない個別課題に触れ、コーチングの具体的価値を自然に伝える文章（150字程度）"
}
`.trim()
}

// ── モック戦略（APIキー未設定・エラー時のフォールバック） ──
// ヒアリングデータと診断タイプを使って最低限の差別化を行う
function getMockStrategy(h: HearingData, d: DiagnosisResult) {
  const ageGroup = getAgeGroup(h.age)
  const primaryPlace = h.meetingPlaces[0] || 'マッチングアプリ'
  const topChallenge = h.currentChallenges[0] || '出会いの少なさ'
  const topBreakup = h.breakupReasons[0] || 'すれ違い'
  const hobbies2 = h.hobbies.slice(0, 2).join('・') || '趣味活動'
  const socialProfile = getSocialProfile(h.extrovertLevel)

  // タイプ別の戦略フレーズ
  const typeStrategies: Record<string, { shortAction: string; mediumAction: string; advice: string }> = {
    情熱型: {
      shortAction: `行動する前に「相手のペースを尊重する間（ま）」を1日置く習慣を作る`,
      mediumAction: '感情を伝えるタイミングを「相手から3つのシグナルが来てから」と決める',
      advice: `情熱型の強み「${d.strengths[0]}」を活かしながら、行動前に「相手にとって心地よいか」を5秒考えるクセをつけること`,
    },
    安定型: {
      shortAction: `「完璧な準備ができてから」という先延ばし癖を断ち切り、70%準備できたら動く`,
      mediumAction: '週に1回、自分から新しいアクションを起こす「チャレンジデー」を設ける',
      advice: `安定型の「信頼感」は時間がかかるほど価値が出る。ただし「待ちすぎ」で相手が他に行くリスクを常に意識すること`,
    },
    自由型: {
      shortAction: `自分の趣味・価値観（${hobbies2}）を話す練習を週3回、身近な人に行う`,
      mediumAction: '1週間に1つ、自分の「弱さ・失敗談」を自己開示する機会を作る',
      advice: `自由型の個性は最大の武器。ただし「壁を作っている」と相手に思わせないよう、笑顔で話しかけられたら必ず3文以上返す習慣をつけること`,
    },
    献身型: {
      shortAction: `「相手のため」行動を週2回に制限し、残りは自分の充実に使う時間を意識的に作る`,
      mediumAction: '自分の意見・要望を1日1回、相手に伝える練習をする（小さなことから）',
      advice: `献身型はまず「自分が楽しんでいる姿」を見せることが最優先。尽くす前に「自分が満たされているか」を確認すること`,
    },
    知性型: {
      shortAction: `気になる人に「面白いな」と思ったら、考える前にその場で一言だけ声をかける練習`,
      mediumAction: '会話の中で「論理」より「感情の共感」を先に返す練習（「なるほど」より「それ大変だったね」）',
      advice: `知性型の深い会話力は最高の武器。ただし「分析モード」をオフにして感情的に反応できる時間を1日10分作ること`,
    },
    魅力型: {
      shortAction: `気になる特定の1人に絞り、その人だけへの「差別化シグナル」（他の人には言わない一言など）を週1回送る`,
      mediumAction: '広い人脈の中から「真剣に向き合いたい相手」を1〜2人に絞り込む作業をする',
      advice: `魅力型の「みんなに優しい」は長所でもあるが、好意が伝わらない原因でもある。「この人だけ特別扱い」という行動を意識的に増やすこと`,
    },
  }
  const ts = typeStrategies[d.type] || typeStrategies['安定型']

  return {
    analysis: `${h.gender}・${ageGroup}・${d.type}タイプのあなたの最大の課題は「${topChallenge}」です。${h.occupation}という環境で${socialProfile}の傾向があり、${hobbies2}という趣味を持つあなたが主に「${primaryPlace}」で出会いを探している現状を踏まえると、過去に「${topBreakup}」で関係が終わったパターンを繰り返さないための設計が不可欠です。${d.type}の強み（${d.strengths[0]}）を活かしながら、弱点（${d.weaknesses[0]}）を補う段階的な戦略が最も効果的です。`,
    strengths: [
      `${d.type}ならではの「${d.strengths[0]}」は、${primaryPlace}での第一印象作りで圧倒的な差別化になる`,
      `${hobbies2}という趣味・ライフスタイルは、価値観の合う相手を自然に引き寄せる強力な磁石になる`,
      d.strengths[2] || `${h.occupation}としての経験や視点は、会話の深みと信頼感に直結する魅力`,
    ],
    challenges: [
      `「${topChallenge}」という課題は、${d.type}の弱点「${d.weaknesses[0]}」が根本原因になっている可能性が高い`,
      `過去に「${topBreakup}」が原因で別れたパターンは、意識的に変えないと同じ結末を繰り返すリスクがある`,
    ],
    strategy: {
      title: `${d.type}の${h.gender}（${ageGroup}）が「${topChallenge}」を乗り越えて理想の恋人を作る3ヶ月戦略`,
      description: `${primaryPlace}を主戦場に、社交性${h.extrovertLevel}/10（${socialProfile}）に合わせたペースで接触回数を増やしながら、${d.type}の強みを前面に出す。「${topChallenge}」の解決を最優先に、${h.idealRelationship}という理想に向けて週次で着実に行動します。`,
      shortTerm: [
        `${primaryPlace}${primaryPlace.includes('アプリ') ? 'のプロフィールを「${d.type}らしさ」が伝わる内容に完全リニューアルし、週${Math.max(2, Math.round(h.extrovertLevel / 2))}回はいいね・メッセージを送る' : 'での出会いの機会を週${Math.max(1, Math.round(h.extrovertLevel / 3))}回以上意識的に作る'}`,
        ts.shortAction,
        `${hobbies2}を活かした出会いの場（コミュニティ・イベント）に月1回参加する`,
      ],
      mediumTerm: [
        `気になる相手との「2回目の接触」を自分から作る（${h.extrovertLevel <= 4 ? 'テキストやSNSで自然につながるところから始める' : '直接「また話したい」と言える状況を作る'}）`,
        ts.mediumAction,
        `「${h.importantTraits[0] || '価値観'}」の共通点を見つける会話を意識的に行い、相手との共鳴を作る`,
      ],
      longTerm: [
        `交際に向けた意思確認を、相手が${h.idealRelationship.includes('安定') ? '安心感を感じたタイミング' : '特別な体験を共有した後の自然な流れ'}で伝える`,
        `「${topBreakup}」の失敗を防ぐため、相手との価値観・将来観のすり合わせを事前に行う`,
        `${h.idealRelationship}という理想の関係に向けた具体的な約束・共有体験を作る`,
      ],
    },
    weeklyPlan: [
      {
        week: 1,
        theme: `${d.type}の強みを使った「${primaryPlace}」攻略基盤作り`,
        actions: [
          `${primaryPlace}${primaryPlace.includes('アプリ') ? 'のプロフィール写真・文章を「${d.type}らしさ」が伝わる内容に更新' : 'での自己紹介・第一印象を「${d.type}の強み」を活かした形に整える'}`,
          `${d.type}の強み「${d.strengths[0]}」が伝わる会話ネタを3つ準備する`,
          `社交性${h.extrovertLevel}/10に合わせた週の行動目標を設定（無理なく続けられる量に）`,
        ],
        milestone: `${primaryPlace}で新しい接点が生まれ、気になる相手が1人以上見つかっている状態`,
      },
      {
        week: 2,
        theme: '接触頻度を上げ・記憶に残る存在になる',
        actions: [
          `気になる相手に週2〜3回、${h.extrovertLevel <= 4 ? 'メッセージやSNSで' : '直接・対面で'}自然な接触を作る`,
          `${d.type}の弱点「${d.weaknesses[0]}」を克服するための小さな練習を1日1回行う`,
          `「${hobbies2}」の話題を使って共通の話題・体験を生み出す`,
        ],
        milestone: '気になる相手と複数回会話が成立し、相手があなたのことを覚えている状態',
      },
      {
        week: 3,
        theme: '特別な存在として印象を確立する',
        actions: [
          `${d.type}の「${d.strengths[0]}」を相手が感じるシーンを意図的に作る（具体的な言動）`,
          `相手の「${h.importantTraits[0] || '価値観'}」への共感を示す行動・言葉を使う`,
          `1対1の時間（ランチ・カフェ等）に誘うか、誘われやすい状況を意図的に作る`,
        ],
        milestone: '相手から自発的に連絡が来る、または「また一緒にいたい」という反応が出ている',
      },
      {
        week: 4,
        theme: '関係性を確立・次のステージへ進む',
        actions: [
          `特別な体験（${h.hobbies[0] ? h.hobbies[0] + '関連のデート等' : 'いつもと違う場所・体験'})を共有し、感情的な絆を深める`,
          `「${topBreakup}」の失敗を繰り返さないための価値観・関係観の確認会話を行う`,
          `${h.idealRelationship}という理想に向けて、関係性の方向性を自然な流れで確認する`,
        ],
        milestone: '交際に向けた明確なステータス変化、または継続的に会う約束が決まっている状態',
      },
    ],
    keyAdvice: [
      ts.advice,
      `${h.gender}・${ageGroup}として恋愛市場での強みは「${d.strengths[1] || d.strengths[0]}」。同世代・同性との差別化ポイントとして意識的に前面に出すこと`,
      `「${topChallenge}」は行動の「量」ではなく「的確さ」の問題。${primaryPlace}での行動を週${Math.max(3, h.extrovertLevel)}回に増やしながら、毎回「${d.type}の強みが伝わったか」を自己採点する習慣をつけること`,
    ],
    coachingMessage: `${d.type}タイプの${h.gender}が「${topChallenge}」を乗り越えるための戦略はAIで作れましたが、実際の会話でのリアルタイム修正や「なぜかうまくいかない」という個別の壁は、プロコーチとの1対1のセッションでこそ解決できます。3ヶ月変化がなければ全額返金保証付きです。`,
  }
}
