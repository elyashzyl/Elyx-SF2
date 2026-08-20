<?php

namespace App\Helpers;

class LevelHelper
{
    public const XP_PER_LEVEL = 100;

    public const TITLES = [
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

    public static function level(int $points): int
    {
        return intdiv(max(0, $points), self::XP_PER_LEVEL) + 1;
    }

    public static function progress(int $points): int
    {
        return max(0, $points) % self::XP_PER_LEVEL;
    }

    public static function pointsForLevel(int $level): int
    {
        return max(0, $level - 1) * self::XP_PER_LEVEL;
    }

    public static function title(int $level): string
    {
        return self::TITLES[$level - 1] ?? 'Champion';
    }

    public static function titleForPoints(int $points): string
    {
        return self::title(self::level($points));
    }

    /**
     * Secret rewards hidden until the student reaches the matching level.
     */
    public const REWARDS = [
        1 => ['name' => 'XP Booster Token', 'description' => 'Earn 2× XP on your very next game. Use it wisely.'],
        2 => ['name' => 'Golden Pencil', 'description' => 'A legendary writing instrument. Perfect for taking notes in style.'],
        3 => ['name' => 'Homework Pass', 'description' => 'Skip one homework assignment, free of charge.'],
        4 => ['name' => 'Brain Power Shield', 'description' => 'Protects you from one wrong answer.'],
        5 => ['name' => 'Time Warp Hourglass', 'description' => 'Add 30 extra seconds to any quiz or game.'],
        6 => ['name' => 'Star Compass', 'description' => 'Always points you toward the right answer.'],
        7 => ['name' => "Scholar's Scroll", 'description' => 'Contains one hidden study tip nobody else knows.'],
        8 => ['name' => 'Focus Potion', 'description' => 'Blocks all distractions for one full study session.'],
        9 => ['name' => 'Quiz Snapshot', 'description' => 'Preview one question before a quiz even starts.'],
        10 => ['name' => 'Double Down Die', 'description' => 'Roll it for a chance to double your next XP haul.'],
        11 => ['name' => "Master's Seal", 'description' => 'A mark of true mastery — earned, never given.'],
        12 => ['name' => 'Crown of Knowledge', 'description' => 'Wear it and the whole school will know your power.'],
        13 => ['name' => 'Immortal Flame', 'description' => 'The rarest reward. Your name joins the Hall of Legends.'],
    ];

    /**
     * Only rewards for levels the student has actually reached are returned,
     * so future rewards stay secret on the client.
     *
     * @return array<int, array{level: int, title: string, description: string}>
     */
    public static function unlockedRewards(int $points): array
    {
        $current = self::level($points);
        $rewards = [];

        foreach (self::REWARDS as $level => $reward) {
            if ($level > $current) {
                break;
            }

            $rewards[] = [
                'level' => $level,
                'title' => $reward['name'],
                'description' => $reward['description'],
            ];
        }

        return $rewards;
    }
}