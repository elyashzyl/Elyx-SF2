/**
 * Shared XP calculation — mirrors PointsHelper::calculate() on the server.
 * Used by Quizzes/Index, Seatworks/Index, Exams/Index, Practicals/Index.
 */
export const XP_TIERS = [
    { minPct: 80, points: 10 },
    { minPct: 60, points: 5 },
    { minPct: 1,  points: 1 },
] as const;

export function xpForPercentage(pct: number): number {
    if (pct < 0) {
        return 0;
    }

    for (const tier of XP_TIERS) {
        if (pct >= tier.minPct) {
            return tier.points;
        }
    }

    return 0;
}

export function maxPossibleXp(): number {
    return XP_TIERS[0].points;
}