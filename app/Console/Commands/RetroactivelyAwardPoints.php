<?php

namespace App\Console\Commands;

use App\Helpers\PointsHelper;
use App\Models\ExamAttempt;
use App\Models\PracticalAttempt;
use App\Models\QuizAttempt;
use App\Models\SeatworkAttempt;
use Illuminate\Console\Command;

class RetroactivelyAwardPoints extends Command
{
    protected $signature = 'points:retroactively-award';
    protected $description = 'Award points for all existing graded attempts that predate the points system';

    public function handle(): int
    {
        $total = 0;

        // ── Quiz Attempts ──────────────────────────────────────────
        $this->info('Processing Quiz attempts...');
        QuizAttempt::where('status', 'submitted')
            ->where('score', '>=', 0)
            ->chunk(100, function ($attempts) use (&$total) {
                foreach ($attempts as $attempt) {
                    PointsHelper::award(
                        $attempt->student_id,
                        'Quiz',
                        $attempt->quiz_id,
                        $attempt->score,
                        $attempt->total_points,
                    );
                    $total++;
                }
            });
        $this->info("  → {$total} Quiz attempts processed.");

        // ── Seatwork Attempts ──────────────────────────────────────
        $this->info('Processing Seatwork attempts...');
        SeatworkAttempt::where('status', 'submitted')
            ->where('score', '>=', 0)
            ->chunk(100, function ($attempts) use (&$total) {
                foreach ($attempts as $attempt) {
                    PointsHelper::award(
                        $attempt->student_id,
                        'Seatwork',
                        $attempt->seatwork_id,
                        $attempt->score,
                        $attempt->total_points,
                    );
                    $total++;
                }
            });
        $this->info("  → {$total} Seatwork attempts processed.");

        // ── Practical Attempts ─────────────────────────────────────
        $this->info('Processing Practical attempts...');
        PracticalAttempt::where('status', 'submitted')
            ->whereNotNull('total_score')
            ->with('practical:id,max_score')
            ->chunk(100, function ($attempts) use (&$total) {
                foreach ($attempts as $attempt) {
                    $maxScore = $attempt->practical?->max_score ?? 0;
                    PointsHelper::award(
                        $attempt->student_id,
                        'Practical',
                        $attempt->practical_id,
                        $attempt->total_score,
                        $maxScore,
                    );
                    $total++;
                }
            });
        $this->info("  → {$total} Practical attempts processed.");

        // ── Exam Attempts ──────────────────────────────────────────
        $this->info('Processing Exam attempts...');
        ExamAttempt::where('status', 'submitted')
            ->whereNotNull('total_score')
            ->with('exam:id,max_score')
            ->chunk(100, function ($attempts) use (&$total) {
                foreach ($attempts as $attempt) {
                    $maxScore = $attempt->exam?->max_score ?? 0;
                    PointsHelper::award(
                        $attempt->student_id,
                        'Exam',
                        $attempt->exam_id,
                        $attempt->total_score,
                        $maxScore,
                    );
                    $total++;
                }
            });
        $this->info("  → {$total} Exam attempts processed.");

        $this->newLine();
        $this->info("Done! Total attempts processed: {$total}");

        return Command::SUCCESS;
    }
}
