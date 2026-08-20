export const XP_PER_LEVEL = 100;

export const LEVEL_TITLES = [
    'Novice',
    'Beginner',
    'Explorer',
    'Scholar',
    'Achiever',
    'Rising Star',
    'Skilled',
    'Expert',
    'Master',
    'Grandmaster',
    'Legend',
    'Mythic',
    'Immortal',
];

export function levelForPoints(points: number): number {
    return Math.floor(Math.max(0, Number(points) || 0) / XP_PER_LEVEL) + 1;
}

export function progressForLevel(points: number): number {
    return Math.max(0, Number(points) || 0) % XP_PER_LEVEL;
}

export function pointsForLevel(level: number): number {
    return Math.max(0, level - 1) * XP_PER_LEVEL;
}

export function nextLevelPoints(points: number): number {
    return levelForPoints(points) * XP_PER_LEVEL;
}

export function titleForLevel(level: number): string {
    return LEVEL_TITLES[level - 1] ?? 'Champion';
}

export function progressPct(points: number): number {
    const p = progressForLevel(points);

    return Math.min(100, Math.round((p / XP_PER_LEVEL) * 100));
}
