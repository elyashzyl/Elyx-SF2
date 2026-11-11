/**
 * DepEd Order No. 8, s. 2015 - Policy Guidelines on Classroom Assessment
 * Transmutation Table, Initial Grade Calculation, and Honors Evaluation
 */

/**
 * Official DepEd Transmutation Table mapping Initial Grade (0-100) to Transmuted Grade (60-100)
 */
export function transmuteGrade(initialGrade) {
  const val = Number(initialGrade) || 0
  if (val >= 100) return 100
  if (val >= 98.40) return 99
  if (val >= 96.80) return 98
  if (val >= 95.20) return 97
  if (val >= 93.60) return 96
  if (val >= 92.00) return 95
  if (val >= 90.40) return 94
  if (val >= 88.80) return 93
  if (val >= 87.20) return 92
  if (val >= 85.60) return 91
  if (val >= 84.00) return 90
  if (val >= 82.40) return 89
  if (val >= 80.80) return 88
  if (val >= 79.20) return 87
  if (val >= 77.60) return 86
  if (val >= 76.00) return 85
  if (val >= 74.40) return 84
  if (val >= 72.80) return 83
  if (val >= 71.20) return 82
  if (val >= 69.60) return 81
  if (val >= 68.00) return 80
  if (val >= 66.40) return 79
  if (val >= 64.80) return 78
  if (val >= 63.20) return 77
  if (val >= 61.60) return 76
  if (val >= 60.00) return 75
  if (val >= 56.00) return 74
  if (val >= 52.00) return 73
  if (val >= 48.00) return 72
  if (val >= 44.00) return 71
  if (val >= 40.00) return 70
  if (val >= 36.00) return 69
  if (val >= 32.00) return 68
  if (val >= 28.00) return 67
  if (val >= 24.00) return 66
  if (val >= 20.00) return 65
  if (val >= 16.00) return 64
  if (val >= 12.00) return 63
  if (val >= 8.00) return 62
  if (val >= 4.00) return 61
  return 60
}

/**
 * Calculate Initial Grade based on scores and weights
 * @param {number} wwScore Written Work raw score
 * @param {number} wwTotal Written Work total points
 * @param {number} wwWeight Weight in % (e.g., 30)
 * @param {number} ptScore Performance Task raw score
 * @param {number} ptTotal Performance Task total points
 * @param {number} ptWeight Weight in % (e.g., 50)
 * @param {number} qaScore Quarterly Assessment raw score
 * @param {number} qaTotal Quarterly Assessment total points
 * @param {number} qaWeight Weight in % (e.g., 20)
 * @returns {number} Initial Grade (0 - 100) rounded to 2 decimal places
 */
export function calculateInitialGrade(
  wwScore = 0, wwTotal = 100, wwWeight = 30,
  ptScore = 0, ptTotal = 100, ptWeight = 50,
  qaScore = 0, qaTotal = 50, qaWeight = 20
) {
  const wwPct = wwTotal > 0 ? (Math.min(Number(wwScore) || 0, wwTotal) / wwTotal) * 100 : 0
  const ptPct = ptTotal > 0 ? (Math.min(Number(ptScore) || 0, ptTotal) / ptTotal) * 100 : 0
  const qaPct = qaTotal > 0 ? (Math.min(Number(qaScore) || 0, qaTotal) / qaTotal) * 100 : 0

  const totalWeight = (Number(wwWeight) || 0) + (Number(ptWeight) || 0) + (Number(qaWeight) || 0)
  const normWeight = totalWeight > 0 ? totalWeight : 100

  const weightedWW = (wwPct * (Number(wwWeight) || 0)) / normWeight
  const weightedPT = (ptPct * (Number(ptWeight) || 0)) / normWeight
  const weightedQA = (qaPct * (Number(qaWeight) || 0)) / normWeight

  const initial = weightedWW + weightedPT + weightedQA
  return Math.round(initial * 100) / 100
}

/**
 * Determine DepEd Academic Honors classification
 * @param {number} generalAverage General average grade
 * @param {number[]} quarterlySubjectGrades Optional array of all subject grades to verify no grade is below 85
 */
export function determineHonors(generalAverage, quarterlySubjectGrades = []) {
  const avg = Number(generalAverage) || 0
  // DepEd criteria: no grade below 85 in any learning area for honors
  const hasLowGrade = quarterlySubjectGrades.some(g => Number(g) < 85)
  if (hasLowGrade || avg < 90) {
    if (avg >= 75) return { status: 'Passed', honorTitle: null }
    return { status: 'Failed', honorTitle: null }
  }

  if (avg >= 98) return { status: 'Passed', honorTitle: 'With Highest Honors' }
  if (avg >= 95) return { status: 'Passed', honorTitle: 'With High Honors' }
  return { status: 'Passed', honorTitle: 'With Honors' }
}

/**
 * DepEd Proficiency Descriptors based on Transmuted Grade
 */
export function getProficiencyLevel(grade) {
  const g = Number(grade) || 0
  if (g >= 90) return 'Outstanding'
  if (g >= 85) return 'Very Satisfactory'
  if (g >= 80) return 'Satisfactory'
  if (g >= 75) return 'Fairly Satisfactory'
  return 'Did Not Meet Expectations'
}

/**
 * Calculate Component Total, Percentage Score (PS), and Weighted Score (WS)
 * per DepEd Order No. 8, s. 2015.
 * Supports score clamping to HPS and special attendance marks:
 * - 'AE' (Absent Excused): Learner is exempt; this item's HPS is excluded from the denominator.
 * - 'AU' (Absent Unexcused): Learner gets 0; this item's HPS remains in the denominator.
 * @param {Array<number|string>} scores Raw scores array (numbers or 'AE' / 'AU')
 * @param {number[]} hps Highest Possible Scores array
 * @param {number} weight Component weight percentage (e.g., 30)
 */
export function calculateDepEdComponent(scores = [], hps = [], weight = 30) {
  const safeScores = Array.isArray(scores) ? scores : []
  const safeHps = Array.isArray(hps) ? hps : []

  let totalRaw = 0
  let effectiveHps = 0
  let nominalHps = 0
  let aeCount = 0
  let auCount = 0

  const len = safeHps.length
  for (let i = 0; i < len; i++) {
    const max = Math.max(0, Number(safeHps[i]) || 0)
    nominalHps += max

    const s = safeScores[i]
    const sStr = typeof s === 'string' ? s.trim().toUpperCase() : ''

    if (sStr === 'AE') {
      // Absent Excused: learner is exempt, item is omitted from denominator
      aeCount++
    } else if (sStr === 'AU') {
      // Absent Unexcused: learner earns 0, item HPS is counted in denominator
      auCount++
      effectiveHps += max
    } else {
      // Numeric score: clamp to [0, max]
      const num = (s === '' || s === null || s === undefined || isNaN(Number(s))) ? 0 : Number(s)
      const clamped = Math.max(0, Math.min(max, num))
      totalRaw += clamped
      effectiveHps += max
    }
  }

  let ps = 0
  if (effectiveHps > 0) {
    ps = (totalRaw / effectiveHps) * 100
  } else if (len > 0 && aeCount === len) {
    // If every item was Absent Excused, the learner is exempt from this component
    ps = 100
  }

  const ws = (ps * (Number(weight) || 0)) / 100

  return {
    totalRaw: Math.round(totalRaw * 100) / 100,
    totalHps: Math.round(effectiveHps * 100) / 100,
    nominalHps: Math.round(nominalHps * 100) / 100,
    ps: Math.round(ps * 100) / 100,
    ws: Math.round(ws * 100) / 100,
    aeCount,
    auCount
  }
}

/**
 * Calculate Full DepEd E-Class Record for a learner.
 * Supports unified PT or split PT (Recitation + Seatwork / Performance Task).
 */
export function calculateLearnerEClassRecord({
  wwScores = [], wwHps = [], weightWw = 30,
  ptScores = [], ptHps = [], weightPt = 50,
  qaScores = [], qaHps = [], weightQa = 20,
  isPtSplit = false,
  recScores = [], recHps = [], weightRec = 20,
  swScores = [], swHps = [], weightSw = 30
}) {
  const ww = calculateDepEdComponent(wwScores, wwHps, weightWw)
  const qa = calculateDepEdComponent(qaScores, qaHps, weightQa)

  let pt
  let rec = null
  let sw = null
  const split = Boolean(isPtSplit)

  if (split) {
    const numWeightPt = Math.round((Number(weightPt) || 0) * 100) / 100
    const numWeightRec = Math.round((Number(weightRec) || 0) * 100) / 100
    const numWeightSw = Math.round((Number(weightSw) || 0) * 100) / 100
    const subTotal = Math.round((numWeightRec + numWeightSw) * 100) / 100

    if (Math.abs(subTotal - numWeightPt) > 0.001) {
      throw new Error(`Recitation weight (${numWeightRec}%) and Seatwork weight (${numWeightSw}%) must equal total PT weight (${numWeightPt}%)`)
    }

    rec = calculateDepEdComponent(recScores, recHps, numWeightRec)
    sw = calculateDepEdComponent(swScores, swHps, numWeightSw)

    const ptWs = Math.round((rec.ws + sw.ws) * 100) / 100
    const ptTotalRaw = Math.round((rec.totalRaw + sw.totalRaw) * 100) / 100
    const ptTotalHps = Math.round((rec.totalHps + sw.totalHps) * 100) / 100
    const ptPs = ptTotalHps > 0
      ? Math.round((ptTotalRaw / ptTotalHps) * 10000) / 100
      : (numWeightPt > 0 ? Math.round((ptWs / numWeightPt) * 10000) / 100 : 0)

    pt = {
      totalRaw: ptTotalRaw,
      totalHps: ptTotalHps,
      nominalHps: (rec.nominalHps || rec.totalHps) + (sw.nominalHps || sw.totalHps),
      ps: ptPs,
      ws: ptWs,
      isSplit: true,
      rec,
      sw
    }
  } else {
    pt = calculateDepEdComponent(ptScores, ptHps, weightPt)
  }

  const initialGrade = Math.round((ww.ws + pt.ws + qa.ws) * 100) / 100
  const transmutedGrade = transmuteGrade(initialGrade)
  const remarks = transmutedGrade >= 75 ? 'Passed' : 'Failed'

  return {
    ww,
    pt,
    qa,
    rec,
    sw,
    isPtSplit: split,
    initialGrade,
    transmutedGrade,
    remarks
  }
}
