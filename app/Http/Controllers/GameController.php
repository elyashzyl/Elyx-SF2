<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\GameProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    public function studentGames(): Response
    {
        $student = Auth::user();
        $games = Game::with('cards')
            ->with(['progress' => fn ($q) => $q->where('user_id', $student->id)])
            ->where('hidden', false)
            ->where(function ($q) use ($student) {
                $q->whereNull('grade');
                if ($student->grade) {
                    $q->orWhere('grade', $student->grade)
                        ->orWhere('grade', preg_replace('/\s*Grade\s*/i', '', $student->grade));
                }
            })
            ->latest()->get();

        return Inertia::render('Student/Games', ['games' => $games]);
    }

    public function saveProgress(Request $request, Game $game): JsonResponse
    {
        $student = Auth::user();

        $existingProgress = GameProgress::where('user_id', $student->id)
            ->where('game_id', $game->id)
            ->first();

        if ($existingProgress && $existingProgress->completed) {
            return response()->json(['ok' => true, 'progress' => $existingProgress, 'awarded' => false, 'xp' => 0]);
        }

        $data = $request->validate([
            'current_card' => ['nullable', 'integer', 'min:0'],
            'done_count' => ['nullable', 'integer', 'min:0'],
            'score' => ['nullable', 'integer', 'min:0'],
            'completed' => ['nullable', 'boolean'],
            'card_order' => ['nullable', 'string', 'max:2000'],
            'graded' => ['nullable', 'array'],
        ]);

        $game->loadCount('cards');

        $completed = !empty($data['completed']);
        if (!$completed && !in_array($game->type, ['memorymatch', 'dragdrop', 'ordering'], true)) {
            // 'flashcard' tracks the current card index (0-based), so reaching the
            // last card means the whole deck was seen.
            $threshold = $game->type === 'flashcard' ? ((int) $game->cards_count - 1) : (int) $game->cards_count;
            $completed = (int) ($data['done_count'] ?? 0) >= $threshold;
        }

        $progress = GameProgress::updateOrCreate(
            ['user_id' => $student->id, 'game_id' => $game->id],
            [
                'current_card' => $data['current_card'] ?? 0,
                'done_count' => $data['done_count'] ?? 0,
                'score' => $data['score'] ?? 0,
                'completed' => $completed,
                'card_order' => $data['card_order'] ?? null,
                'graded' => isset($data['graded']) ? json_encode($data['graded']) : null,
            ]
        );

        $awarded = false;
        $xp = 0;
        if ($completed) {
            $existing = \App\Models\StudentPoint::where('student_id', $student->id)
                ->where('activity_type', \App\Enums\ActivityType::Game->value)
                ->where('activity_id', $game->id)
                ->exists();

            if (!$existing) {
                $correctCount = (int) \Illuminate\Support\Facades\DB::table('game_correct_answers')
                    ->where('user_id', $student->id)
                    ->where('game_id', $game->id)
                    ->count();
                $points = ($correctCount * (int) config('gamification.correct_answer_xp')) + (int) $game->xp_reward;

                \App\Models\StudentPoint::create([
                    'student_id' => $student->id,
                    'activity_type' => \App\Enums\ActivityType::Game->value,
                    'activity_id' => $game->id,
                    'points' => $points,
                    'score' => $correctCount,
                    'total' => $game->cards_count,
                    'reason' => 'Completed game: ' . $game->title,
                ]);
                $student->increment('total_points', $points);
                $awarded = true;
                $xp = $points;
            }
        }

        if ($completed) {
            $progress->update(['completed' => true]);
        }

        return response()->json(['ok' => true, 'progress' => $progress, 'awarded' => $awarded, 'xp' => $xp]);
    }

    public function correctAnswer(Request $request, Game $game): JsonResponse
    {
        $student = Auth::user();

        $existingProgress = GameProgress::where('user_id', $student->id)
            ->where('game_id', $game->id)
            ->first();

        if ($existingProgress && $existingProgress->completed) {
            return response()->json(['ok' => false, 'message' => 'This game has already been completed and cannot be retaken.'], 403);
        }

        $data = $request->validate([
            'card_id' => ['required', 'integer', 'min:1'],
        ]);

        $card = $game->cards()->where('id', $data['card_id'])->first();
        if (!$card) {
            return response()->json(['ok' => false, 'message' => 'Card not found.'], 422);
        }

        $already = \Illuminate\Support\Facades\DB::table('game_correct_answers')
            ->where('user_id', $student->id)
            ->where('game_id', $game->id)
            ->where('card_id', $card->id)
            ->exists();

        $awarded = false;
        $xp = (int) config('gamification.correct_answer_xp');
        if (!$already) {
            \Illuminate\Support\Facades\DB::table('game_correct_answers')->insert([
                'user_id' => $student->id,
                'game_id' => $game->id,
                'card_id' => $card->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $awarded = true;
        }

        return response()->json(['ok' => true, 'awarded' => $awarded, 'xp' => $xp]);
    }

    public function index(): Response
    {
        $teacher = Auth::user();
        $games = $teacher->isSuperadmin()
            ? Game::with('cards')->latest()->get()
            : Game::where('teacher_id', $teacher->id)->with('cards')->latest()->get();

        return Inertia::render('Teacher/Games', ['games' => $games]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:100'],
            'grade' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'xp_reward' => ['required', 'integer', 'min:1', 'max:100'],
            'type' => ['required', 'in:' . \App\Enums\GameType::validationList()],
            'cards' => ['required', 'array', 'min:1'],
            'cards.*.question' => ['required', 'string'],
            'cards.*.answer' => ['required', 'string'],
            'cards.*.color' => ['nullable', 'string', 'max:20'],
            'cards.*.options' => ['nullable', 'array'],
        ]);

        $game = Game::create([
            'teacher_id' => Auth::id(),
            'title' => $data['title'],
            'subject' => $data['subject'],
            'grade' => $data['grade'],
            'description' => $data['description'] ?? '',
            'xp_reward' => $data['xp_reward'],
            'type' => $data['type'],
        ]);

        foreach ($data['cards'] as $i => $card) {
            $game->cards()->create([
                'question' => $card['question'],
                'answer' => $card['answer'],
                'color' => $card['color'] ?? null,
                'order' => $i,
                'options' => $card['options'] ?? null,
            ]);
        }

        return back()->with('success', 'Game created.');
    }

    public function update(Request $request, Game $game): RedirectResponse
    {
        $this->authorizeOwner($game);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:100'],
            'grade' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'xp_reward' => ['required', 'integer', 'min:1', 'max:100'],
            'type' => ['required', 'in:' . \App\Enums\GameType::validationList()],
            'cards' => ['required', 'array', 'min:1'],
            'cards.*.question' => ['required', 'string'],
            'cards.*.answer' => ['required', 'string'],
            'cards.*.color' => ['nullable', 'string', 'max:20'],
            'cards.*.options' => ['nullable', 'array'],
        ]);

        $game->update([
            'title' => $data['title'],
            'subject' => $data['subject'],
            'grade' => $data['grade'],
            'description' => $data['description'] ?? '',
            'xp_reward' => $data['xp_reward'],
            'type' => $data['type'],
        ]);

        $game->cards()->delete();
        foreach ($data['cards'] as $i => $card) {
            $game->cards()->create([
                'question' => $card['question'],
                'answer' => $card['answer'],
                'color' => $card['color'] ?? null,
                'order' => $i,
                'options' => $card['options'] ?? null,
            ]);
        }

        return back()->with('success', 'Game updated.');
    }

    public function toggleHidden(Game $game): RedirectResponse
    {
        $this->authorizeOwner($game);
        $game->update(['hidden' => !$game->hidden]);
        return back();
    }

    public function destroy(Game $game): RedirectResponse
    {
        $this->authorizeOwner($game);
        $game->delete();
        return back()->with('success', 'Game deleted.');
    }

    private function authorizeOwner(Game $game): void
    {
        if (Auth::user()->isSuperadmin()) return;
        abort_if($game->teacher_id !== Auth::id(), 403);
    }
}
