<?php

namespace App\Console\Commands;

use App\Enums\ActivityType;
use App\Models\GameProgress;
use App\Models\StudentPoint;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RemoveFarmedGameXp extends Command
{
    protected $signature = 'games:remove-farmed-xp {--dry-run : Show what would be removed without deleting}';

    protected $description = 'Remove per-card XP that was earned in games that were never completed';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $games = DB::table('games')->get(['id', 'type']);
        $gameTypes = $games->pluck('type', 'id');
        $cardsByGame = DB::table('game_cards')
            ->select('game_id')
            ->selectRaw('COUNT(*) as c')
            ->groupBy('game_id')
            ->pluck('c', 'game_id');
        $cardToGame = DB::table('game_cards')->pluck('game_id', 'id');

        $points = StudentPoint::where('activity_type', ActivityType::Game->value)
            ->get(['id', 'student_id', 'activity_id', 'points']);

        $perCard = $points->filter(fn ($p) => $cardToGame->has($p->activity_id));
        $gameLevel = $points->filter(fn ($p) => ! $cardToGame->has($p->activity_id));

        $completedKeys = $gameLevel->map(fn ($p) => $p->student_id . '|' . $p->activity_id)->flip();
        $progress = GameProgress::where('completed', true)->get(['user_id', 'game_id']);
        $completedProgressKeys = $progress->map(fn ($r) => $r->user_id . '|' . $r->game_id)->flip();

        $byUserGame = $perCard->groupBy(fn ($p) => $p->student_id . '|' . $cardToGame[$p->activity_id]);

        $idsToDelete = [];
        $deductions = [];

        foreach ($byUserGame as $key => $rows) {
            [$userId, $gameId] = array_map('intval', explode('|', $key));
            $cards = (int) ($cardsByGame[$gameId] ?? 0);

            if ($cards < 1) {
                continue;
            }

            if ($completedKeys->has($key) || $completedProgressKeys->has($key)) {
                continue;
            }

            $type = $gameTypes[$gameId] ?? 'flashcard';
            $threshold = $type === 'flashcard' ? $cards - 1 : $cards;
            $correctCount = $rows->count();

            $progDone = null;
            $progRow = GameProgress::where('user_id', $userId)->where('game_id', $gameId)->first();
            if ($progRow) {
                $progDone = (int) $progRow->done_count;
            }

            $finished = $correctCount >= $cards || $progDone >= $threshold;

            if ($finished) {
                continue;
            }

            $sum = (int) $rows->sum('points');

            foreach ($rows as $row) {
                $idsToDelete[] = $row->id;
            }

            $deductions[$userId] = ($deductions[$userId] ?? 0) + $sum;
        }

        if (empty($idsToDelete)) {
            $this->info('No farmed XP found.');

            return Command::SUCCESS;
        }

        $total = array_sum($deductions);

        $this->info('Found ' . count($idsToDelete) . ' farmed point row(s) worth ' . $total . ' XP across ' . count($deductions) . ' user(s).');

        foreach ($deductions as $userId => $sum) {
            $user = User::find($userId);
            $current = $user ? (int) $user->total_points : 0;
            $after = max(0, $current - $sum);
            $this->line("  user#{$userId}  -{$sum} XP  (total {$current} -> {$after})");
        }

        if ($dryRun) {
            $this->line('Dry run – nothing was changed.');

            return Command::SUCCESS;
        }

        DB::transaction(function () use ($idsToDelete, $deductions) {
            StudentPoint::whereIn('id', $idsToDelete)->delete();

            foreach ($deductions as $userId => $sum) {
                $user = User::find($userId);

                if (! $user) {
                    continue;
                }

                $user->total_points = max(0, (int) $user->total_points - $sum);
                $user->save();
            }
        });

        $this->info('Removed and totals adjusted.');

        return Command::SUCCESS;
    }
}