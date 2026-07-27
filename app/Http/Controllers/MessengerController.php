<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MessengerController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        $conversations = Conversation::whereHas('participants', fn ($q) => $q->where('user_id', $user->id)
                ->when(!$user->isSuperadmin(), fn ($q) => $q->whereNull('archived_at'))
            )
            ->with(['participants:id,name,role', 'lastMessage'])
            ->latest('updated_at')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'subject' => $c->subject,
                'other' => $c->participants->firstWhere('id', '!=', $user->id)?->only(['id', 'name', 'role']),
                'last_message' => $c->lastMessage?->body,
                'last_message_at' => $c->lastMessage?->created_at,
                'unread' => !$c->participants->firstWhere('id', $user->id)?->pivot->last_read_at,
            ]);

        $contacts = $user->isSuperadmin()
            ? User::where('id', '!=', $user->id)->orderBy('name')->get(['id', 'name', 'role'])
            : ($user->isTeacher()
                ? $user->students()->orderBy('name')->get(['users.id', 'users.name', 'users.role'])
                : User::whereIn('id', $user->teachers()->pluck('teacher_id'))->orderBy('name')->get(['id', 'name', 'role'])
            );

        return Inertia::render($user->isStudent() ? 'Student/Messenger' : 'Teacher/Messenger', [
            'conversations' => $conversations,
            'contacts' => $contacts,
        ]);
    }

    public function show(Conversation $conversation): Response
    {
        $user = Auth::user();
        abort_unless($conversation->participants()->where('user_id', $user->id)->exists(), 403);

        $conversation->load(['participants:id,name,role', 'messages.sender:id,name']);

        $conversation->participants()->updateExistingPivot($user->id, ['last_read_at' => now()]);

        return Inertia::render($user->isStudent() ? 'Student/Messenger' : 'Teacher/Messenger', [
            'conversation' => [
                'id' => $conversation->id,
                'subject' => $conversation->subject,
                'other' => $conversation->participants->firstWhere('id', '!=', $user->id)?->only(['id', 'name', 'role']),
                'messages' => $conversation->messages->map(fn ($m) => [
                    'id' => $m->id,
                    'sender_id' => $m->sender_id,
                    'sender_name' => $m->sender->name,
                    'body' => $m->body,
                    'created_at' => $m->created_at,
                ]),
            ],
            'conversations' => Conversation::whereHas('participants', fn ($q) => $q->where('user_id', $user->id)
                    ->when(!$user->isSuperadmin(), fn ($q) => $q->whereNull('archived_at'))
                )
                ->with(['participants:id,name,role', 'lastMessage'])
                ->latest('updated_at')
                ->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'subject' => $c->subject,
                    'other' => $c->participants->firstWhere('id', '!=', $user->id)?->only(['id', 'name', 'role']),
                    'last_message' => $c->lastMessage?->body,
                    'last_message_at' => $c->lastMessage?->created_at,
                    'unread' => !$c->participants->firstWhere('id', $user->id)?->pivot->last_read_at,
                ]),
            'contacts' => $user->isSuperadmin()
                ? User::where('id', '!=', $user->id)->orderBy('name')->get(['id', 'name', 'role'])
                : ($user->isTeacher()
                    ? $user->students()->orderBy('name')->get(['users.id', 'users.name', 'users.role'])
                    : User::whereIn('id', $user->teachers()->pluck('teacher_id'))->orderBy('name')->get(['id', 'name', 'role'])
                ),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'message' => ['required', 'string', 'max:10000'],
        ]);

        $recipient = User::findOrFail($validated['recipient_id']);

        $existing = Conversation::whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
            ->whereHas('participants', fn ($q) => $q->where('user_id', $recipient->id))
            ->first();

        $conversation = null;

        if ($existing) {
            $existing->messages()->create(['sender_id' => $user->id, 'body' => $validated['message']]);
            $existing->touch();
            $conversation = $existing;
        } else {
            $conversation = Conversation::create(['subject' => null]);
            $conversation->participants()->attach([$user->id, $recipient->id]);
            $conversation->messages()->create(['sender_id' => $user->id, 'body' => $validated['message']]);
        }

        return redirect()->route($user->isStudent() ? 'student.messenger.show' : 'teacher.messenger.show', $conversation);
    }

    public function sendMessage(Request $request, Conversation $conversation): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($conversation->participants()->where('user_id', $user->id)->exists(), 403);

        $validated = $request->validate(['body' => ['required', 'string', 'max:10000']]);

        $conversation->messages()->create(['sender_id' => $user->id, 'body' => $validated['body']]);
        $conversation->touch();

        return redirect()->route($user->isStudent() ? 'student.messenger.show' : 'teacher.messenger.show', $conversation);
    }

    public function archive(Conversation $conversation): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($conversation->participants()->where('user_id', $user->id)->exists(), 403);

        if ($user->isSuperadmin()) {
            $conversation->delete();
        } else {
            $conversation->participants()->updateExistingPivot($user->id, ['archived_at' => now()]);
        }

        return redirect()->route($user->isStudent() ? 'student.messenger' : 'teacher.messenger');
    }

    public function poll(Request $request, Conversation $conversation)
    {
        $user = Auth::user();
        abort_unless($conversation->participants()->where('user_id', $user->id)->exists(), 403);

        $since = $request->get('since');

        $messages = $conversation->messages()
            ->with('sender:id,name')
            ->when($since, fn ($q) => $q->where('created_at', '>', $since))
            ->orderBy('created_at')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'sender_id' => $m->sender_id,
                'sender_name' => $m->sender->name,
                'body' => $m->body,
                'created_at' => $m->created_at,
            ]);

        $conversation->participants()->updateExistingPivot($user->id, ['last_read_at' => now()]);

        return response()->json(['messages' => $messages]);
    }
}
