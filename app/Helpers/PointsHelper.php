<?php

namespace App\Helpers;

use App\Models\StudentPoint;
use App\Models\User;

class PointsHelper
{
    public static function calculate(float $percentage): int
    {
        $tiers = config('gamification.xp_tiers');

        foreach ($tiers as $tier) {
            if ($percentage >= $tier['min_pct']) {
                return $tier['points'];
            }
        }

        return 0;
    }

    public static function award(int $studentId, string $activityType, int $activityId, int $score, int $total, ?string $reason = null): void
    {
        $existing = StudentPoint::where('student_id', $studentId)
            ->where('activity_type', $activityType)
            ->where('activity_id', $activityId)
            ->first();

        // Only update if no existing record, or the new score is higher
        if ($existing && $existing->score !== null && $score <= $existing->score) {
            return;
        }

        $percentage = $total > 0 ? ($score / $total) * 100 : 0;
        $points = static::calculate($percentage);

        StudentPoint::updateOrCreate(
            [
                'student_id' => $studentId,
                'activity_type' => $activityType,
                'activity_id' => $activityId,
            ],
            [
                'points' => $points,
                'score' => $score,
                'total' => $total,
                'reason' => $reason ?? "{$activityType}: {$score}/{$total} (" . round($percentage) . "%)",
            ]
        );

        User::where('id', $studentId)->update([
            'total_points' => StudentPoint::where('student_id', $studentId)->sum('points'),
        ]);
    }
}
