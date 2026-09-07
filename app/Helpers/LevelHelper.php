<?php

namespace App\Helpers;

class LevelHelper
{
    public static function xpPerLevel(): int
    {
        return (int) config('gamification.xp_per_level', 100);
    }

    public static function level(int $points): int
    {
        return intdiv(max(0, $points), self::xpPerLevel()) + 1;
    }

    public static function progress(int $points): int
    {
        return max(0, $points) % self::xpPerLevel();
    }

    public static function pointsForLevel(int $level): int
    {
        return max(0, $level - 1) * self::xpPerLevel();
    }

    public static function title(int $level): string
    {
        $titles = config('gamification.level_titles', []);
        $fallback = config('gamification.level_title_fallback', 'Champion');

        return $titles[$level - 1] ?? $fallback;
    }

    public static function titleForPoints(int $points): string
    {
        return self::title(self::level($points));
    }

    /**
     * Only rewards for levels the student has actually reached are returned,
     * so future rewards stay secret on the client.
     *
     * @return array<int, array{level: int, title: string, description: string}>
     */
    public static function unlockedRewards(int $points): array
    {
        $rewards = (array) config('gamification.level_rewards', []);
        $current = self::level($points);
        $result = [];

        foreach ($rewards as $level => $reward) {
            if ((int) $level > $current) {
                break;
            }

            $result[] = [
                'level' => (int) $level,
                'title' => $reward['name'],
                'description' => $reward['description'],
            ];
        }

        return $result;
    }
}