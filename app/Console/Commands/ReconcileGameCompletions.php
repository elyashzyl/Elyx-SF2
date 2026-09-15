<?php

namespace App\Console\Commands;

use App\Enums\ActivityType;
use App\Models\Game;
use App\Models\GameProgress;
use App\Models\StudentPoint;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReconcileGameCompletions extends Command
{
    protected $signature = 'games:reconcile';

    protected $description = 'Mark finished games as completed and award the outstanding completion bonus';

    public function handle(): int
    {
        $updated = 0;
        $awarded = 0;

        // Pass 1 – non-board progress rows that already reached the last
        // card but were never marked as completed.
        GameProgress::with('game:id,type,title,xp_reward')
            ->where('completed', false)
            ->get()
            ->each(function (GameProgress $progress) use (&$updated, &$awarded) {
                $game = $progress->game;

                if (! $game || in_array($game->type, ['memorymatch', 'dragdrop', 'ordering'], true)) {
                    return;
                }

                $cardsCount = (int) DB::table('game_cards')->where('game_id', $game->id)->count();

                if ($cardsCount < 1) {
                    return;
                }

                // Flashcard tracks the current card index (0-based), so the whole
                // deck has been seen once the last card is reached.
                $threshold = $game->type === 'flashcard' ? $cardsCount - 1 : $cardsCount;

                if ((int) $progress->done_count < $threshold) {
                    return;
                }

                if ($this->awardCompletionBonusIfMissing($progress->user_id, $game->id, $game->xp_reward, $cardsCount, $game->title)) {
                    $awarded++;
                }

                $progress->update(['completed' => true]);
                $updated++;
            });

        // Pass 2 – games (e.g. board games) where every card was answered
        // correctly but no completed progress row was ever saved.
        Game::withCount('cards')->get()->each(function (Game $game) use (&$updated, &$awarded) {
            $cardsCount = (int) $game->cards_count;

            if ($cardsCount < 1) {
                return;
            }

            $userIds = DB::table('game_correct_answers')
                ->select('user_id')
                ->where('game_id', $game->id)
                ->groupBy('user_id')
                ->havingRaw('COUNT(card_id) >= ?', [$cardsCount])
                ->pluck('user_id');

            foreach ($userIds as $userId) {
                $progress = GameProgress::where('user_id', $userId)
                    ->where('game_id', $game->id)
                    ->first();

                if ($progress && $progress->completed) {
                    continue;
                }

                if ($this->awardCompletionBonusIfMissing($userId, $game->id, $game->xp_reward, $cardsCount, $game->title)) {
                    $awarded++;
                }

                GameProgress::updateOrCreate(
                    ['user_id' => $userId, 'game_id' => $game->id],
                    [
                        'current_card' => $cardsCount - 1,
                        'done_count' => $cardsCount,
                        'score' => $cardsCount,
                        'completed' => true,
                        'graded' => json_encode(array_fill(0, $cardsCount, true)),
                    ]
                );
                $updated++;
            }
        });

        $this->newLine();
        $this->info("Completed {$updated} game(s), awarded {$awarded} completion bonus(es).");

        return Command::SUCCESS;
    }

    private function awardCompletionBonusIfMissing(int $userId, int $gameId, int $xpReward, int $cardsCount, string $title): bool
    {
        $exists = StudentPoint::where('student_id', $userId)
            ->where('activity_type', ActivityType::Game->value)
            ->where('activity_id', $gameId)
            ->exists();

        if ($exists) {
            return false;
        }

        $correctCount = (int) DB::table('game_correct_answers')
            ->where('user_id', $userId)
            ->where('game_id', $gameId)
            ->count();

        // Row per-card points only existed under the old instant-award flow.
        // Under the new flow, everything is owed at completion.
        $hasPerCardPoints = StudentPoint::where('student_id', $userId)
            ->where('activity_type', ActivityType::Game->value)
            ->whereIn('activity_id', DB::table('game_cards')->where('game_id', $gameId)->pluck('id'))
            ->exists();

        $points = $hasPerCardPoints
            ? max(0, (int) $xpReward)
            : ($correctCount * (int) config('gamification.correct_answer_xp')) + max(0, (int) $xpReward);

        StudentPoint::create([
            'student_id' => $userId,
            'activity_type' => ActivityType::Game->value,
            'activity_id' => $gameId,
            'points' => $points,
            'score' => $correctCount,
            'total' => $cardsCount,
            'reason' => 'Completed game: ' . $title,
        ]);

        if ($points > 0) {
            User::whereKey($userId)->increment('total_points', $points);
        }

        return true;
    }
}