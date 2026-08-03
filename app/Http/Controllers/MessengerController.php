<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MessengerController extends Controller
{
    private function checkSystemEnabled(): void
    {
        $setting = \App\Models\Setting::find('messenger_system_enabled');
        if ($setting && $setting->value === 'false') {
            abort(404);
        }
    }

    public function index(): Response
    {
        $this->checkSystemEnabled();
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
                : User::where(function ($q) use ($user) {
                    $q->where(function ($qt) use ($user) {
                        $qt->whereIn('id', $user->teachers()->pluck('teacher_id'))
                           ->where('messenger_enabled', true);
                    })->orWhere(function ($q2) use ($user) {
                        $q2->where('role', 'student')
                           ->where('section_id', $user->section_id)
                           ->where('id', '!=', $user->id);
                    });
                })->orderBy('name')->get(['id', 'name', 'role'])
            );

        return Inertia::render($user->isStudent() ? 'Student/Messenger' : 'Teacher/Messenger', [
            'conversations' => $conversations,
            'contacts' => $contacts,
        ]);
    }

    public function show(Conversation $conversation): Response
    {
        $this->checkSystemEnabled();
        $user = Auth::user();
        abort_unless($conversation->participants()->where('user_id', $user->id)->exists(), 403);

        $conversation->load(['participants:id,name,role', 'messages.sender:id,name']);

        $otherParticipant = $conversation->participants->firstWhere('id', '!=', $user->id);
        $otherLastReadAt = $otherParticipant?->pivot?->last_read_at;

        $conversation->participants()->updateExistingPivot($user->id, ['last_read_at' => now()]);

        return Inertia::render($user->isStudent() ? 'Student/Messenger' : 'Teacher/Messenger', [
            'conversation' => [
                'id' => $conversation->id,
                'subject' => $conversation->subject,
                'other' => $otherParticipant?->only(['id', 'name', 'role']),
                'other_last_read_at' => $otherLastReadAt,
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
                    : User::where(function ($q) use ($user) {
                        $q->where(function ($qt) use ($user) {
                            $qt->whereIn('id', $user->teachers()->pluck('teacher_id'))
                               ->where('messenger_enabled', true);
                        })->orWhere(function ($q2) use ($user) {
                            $q2->where('role', 'student')
                               ->where('section_id', $user->section_id)
                               ->where('id', '!=', $user->id);
                        });
                    })->orderBy('name')->get(['id', 'name', 'role'])
                ),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->checkSystemEnabled();
        $user = Auth::user();

        $validated = $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'message' => ['required', 'string', 'max:10000'],
        ]);

        $recipient = User::findOrFail($validated['recipient_id']);

        abort_if($recipient->role === 'teacher' && !$recipient->messenger_enabled, 403, 'This teacher has disabled messenger.');

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
        $this->checkSystemEnabled();
        $user = Auth::user();
        abort_unless($conversation->participants()->where('user_id', $user->id)->exists(), 403);

        $otherParticipant = $conversation->participants()->where('user_id', '!=', $user->id)->first();
        if ($otherParticipant && $otherParticipant->role !== 'student' && !$otherParticipant->messenger_enabled) {
            abort(403, 'This user has disabled messenger.');
        }

        $validated = $request->validate(['body' => ['required', 'string', 'max:10000']]);

        $conversation->messages()->create(['sender_id' => $user->id, 'body' => $validated['body']]);
        $conversation->touch();

        // Award XP every 1000 unique substantial messages (10+ chars, no duplicate spam)
        $messageCount = \App\Models\Message::where('sender_id', $user->id)
            ->whereRaw('LENGTH(body) >= 10')
            ->distinct('body')
            ->count('body');
        if ($messageCount > 0 && $messageCount % 1000 === 0) {
            $user->increment('total_points', 10);
            \App\Models\StudentPoint::create([
                'student_id' => $user->id,
                'activity_type' => 'Message',
                'activity_id' => 0,
                'points' => 10,
                'score' => 10,
                'total' => 10,
                'reason' => "{$messageCount} messages milestone",
            ]);
        }

        return redirect()->route($user->isStudent() ? 'student.messenger.show' : 'teacher.messenger.show', $conversation);
    }

    public function archive(Conversation $conversation): RedirectResponse
    {
        $this->checkSystemEnabled();
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
        $this->checkSystemEnabled();
        $user = Auth::user();
        abort_unless($conversation->participants()->where('user_id', $user->id)->exists(), 403);

        $since = $request->get('since');

        $otherLastReadAt = $conversation->participants()
            ->where('user_id', '!=', $user->id)
            ->first()?->pivot?->last_read_at;

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

        return response()->json(['messages' => $messages, 'other_last_read_at' => $otherLastReadAt]);
    }

    public function unreadCount(): JsonResponse
    {
        $this->checkSystemEnabled();
        $user = Auth::user();

        $count = Conversation::whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
            ->with(['participants:id,name,role', 'lastMessage'])
            ->get()
            ->filter(function ($c) use ($user) {
                $pivot = $c->participants->firstWhere('id', $user->id)?->pivot;
                if (!$pivot->last_read_at) return true;
                $lastMsg = $c->lastMessage;
                return $lastMsg && $lastMsg->created_at->gt($pivot->last_read_at);
            })
            ->count();

        return response()->json(['count' => $count]);
    }
}
