<?php

namespace App\Http\Controllers;

use App\Models\Game;
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
            ->where(function ($q) use ($student) {
                $q->whereNull('grade')->orWhere('grade', $student->grade);
            })
            ->latest()->get();

        return Inertia::render('Student/Games', ['games' => $games]);
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
            'cards' => ['required', 'array', 'min:1'],
            'cards.*.question' => ['required', 'string'],
            'cards.*.answer' => ['required', 'string'],
        ]);

        $game = Game::create([
            'teacher_id' => Auth::id(),
            'title' => $data['title'],
            'subject' => $data['subject'],
            'grade' => $data['grade'],
            'description' => $data['description'] ?? '',
            'xp_reward' => $data['xp_reward'],
        ]);

        foreach ($data['cards'] as $i => $card) {
            $game->cards()->create([
                'question' => $card['question'],
                'answer' => $card['answer'],
                'order' => $i,
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
            'cards' => ['required', 'array', 'min:1'],
            'cards.*.question' => ['required', 'string'],
            'cards.*.answer' => ['required', 'string'],
        ]);

        $game->update([
            'title' => $data['title'],
            'subject' => $data['subject'],
            'grade' => $data['grade'],
            'description' => $data['description'] ?? '',
            'xp_reward' => $data['xp_reward'],
        ]);

        $game->cards()->delete();
        foreach ($data['cards'] as $i => $card) {
            $game->cards()->create([
                'question' => $card['question'],
                'answer' => $card['answer'],
                'order' => $i,
            ]);
        }

        return back()->with('success', 'Game updated.');
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
