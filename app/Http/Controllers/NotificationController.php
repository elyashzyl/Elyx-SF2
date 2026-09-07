<?php

namespace App\Http\Controllers;

use App\Models\ExamAttempt;
use App\Models\PracticalAttempt;
use App\Models\QuizAttempt;
use App\Models\SeatworkAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $user = Auth::user();
        $notifications = [];

        if ($user->isSuperadmin() || $user->role === 'teacher') {
            $notifications = $this->teacherNotifications($user);
        } else {
            $notifications = $this->studentNotifications($user);
        }

        usort($notifications, fn ($a, $b) => strtotime($b['time']) - strtotime($a['time']));

        $readAt = $user->notifications_read_at;
        $unseen = $readAt
            ? array_filter($notifications, fn ($n) => strtotime($n['time']) > strtotime($readAt))
            : $notifications;

        return response()->json([
            'notifications' => array_slice($notifications, 0, (int) config('gamification.notification_limit_teacher')),
            'count' => count($unseen),
        ]);
    }

    public function read(): JsonResponse
    {
        Auth::user()->update(['notifications_read_at' => now()]);
        return response()->json(['ok' => true]);
    }

    private function teacherNotifications($user): array
    {
        $notifs = [];

        $isSuper = $user->isSuperadmin();

        // Practicals
        $practicalQuery = PracticalAttempt::where('status', \App\Enums\AttemptStatus::Submitted->value)->whereNull('total_score');
        if (!$isSuper) {
            $practicalQuery->whereIn('practical_id', $user->practicals()->pluck('id'));
        }
        foreach ($practicalQuery->with('practical:id,title', 'student:id,name')->latest()->limit((int) config('gamification.notification_limit_teacher'))->get() as $a) {
            $notifs[] = [
                'id' => 'practical_' . $a->id,
                'type' => 'practical',
                'title' => 'Practical needs grading',
                'body' => "{$a->student->name} — {$a->practical->title}",
                'link' => route('teacher.practicals.grade', [$a->practical_id, $a->id]),
                'time' => $a->submitted_at,
            ];
        }

        // Quizzes
        $quizQuery = QuizAttempt::where('status', \App\Enums\AttemptStatus::Submitted->value)->whereNull('score');
        if (!$isSuper) {
            $quizQuery->whereIn('quiz_id', $user->quizzes()->pluck('id'));
        }
        foreach ($quizQuery->with('quiz:id,title', 'student:id,name')->latest()->limit((int) config('gamification.notification_limit_teacher'))->get() as $a) {
            $notifs[] = [
                'id' => 'quiz_' . $a->id,
                'type' => 'quiz',
                'title' => 'Quiz needs grading',
                'body' => "{$a->student->name} — {$a->quiz->title}",
                'link' => route('teacher.quizzes.recheck', [$a->quiz_id, $a->id]),
                'time' => $a->submitted_at,
            ];
        }

        // Seatworks
        $swQuery = SeatworkAttempt::where('status', \App\Enums\AttemptStatus::Submitted->value)->whereNull('score');
        if (!$isSuper) {
            $swQuery->whereIn('seatwork_id', $user->seatworks()->pluck('id'));
        }
        foreach ($swQuery->with('seatwork:id,title', 'student:id,name')->latest()->limit((int) config('gamification.notification_limit_teacher'))->get() as $a) {
            $notifs[] = [
                'id' => 'seatwork_' . $a->id,
                'type' => 'seatwork',
                'title' => 'Seatwork needs grading',
                'body' => "{$a->student->name} — {$a->seatwork->title}",
                'link' => route('teacher.seatworks.recheck', [$a->seatwork_id, $a->id]),
                'time' => $a->submitted_at,
            ];
        }

        // Exams
        $examQuery = ExamAttempt::where('status', \App\Enums\AttemptStatus::Submitted->value)->whereNull('total_score');
        if (!$isSuper) {
            $examQuery->whereIn('exam_id', $user->exams()->pluck('id'));
        }
        foreach ($examQuery->with('exam:id,title', 'student:id,name')->latest()->limit((int) config('gamification.notification_limit_teacher'))->get() as $a) {
            $notifs[] = [
                'id' => 'exam_' . $a->id,
                'type' => 'exam',
                'title' => 'Exam needs grading',
                'body' => "{$a->student->name} — {$a->exam->title}",
                'link' => route('teacher.exams.show', $a->exam_id),
                'time' => $a->submitted_at,
            ];
        }

        return $notifs;
    }

    private function studentNotifications($user): array
    {
        $notifs = [];

        $since = now()->subDays(7);

        // Practicals
        foreach (PracticalAttempt::where('student_id', $user->id)
            ->where('status', \App\Enums\AttemptStatus::Submitted->value)->whereNotNull('total_score')
            ->where('updated_at', '>=', $since)
            ->with('practical:id,title')
            ->latest()->limit((int) config('gamification.notification_limit_student_practical'))->get() as $a) {
            $notifs[] = [
                'id' => 'practical_result_' . $a->id,
                'type' => 'practical',
                'title' => 'Practical graded',
                'body' => "{$a->practical->title} — Score: {$a->total_score}",
                'link' => route('student.practicals.result', $a->id),
                'time' => $a->updated_at,
            ];
        }

        // Quizzes
        foreach (QuizAttempt::where('student_id', $user->id)
            ->where('status', \App\Enums\AttemptStatus::Submitted->value)->whereNotNull('score')
            ->where('updated_at', '>=', $since)
            ->with('quiz:id,title')
            ->latest()->limit((int) config('gamification.notification_limit_student_other'))->get() as $a) {
            $notifs[] = [
                'id' => 'quiz_result_' . $a->id,
                'type' => 'quiz',
                'title' => 'Quiz graded',
                'body' => "{$a->quiz->title} — Score: {$a->score}/{$a->total_points}",
                'link' => route('student.quizzes.result', $a->id),
                'time' => $a->updated_at,
            ];
        }

        // Seatworks
        foreach (SeatworkAttempt::where('student_id', $user->id)
            ->where('status', \App\Enums\AttemptStatus::Submitted->value)->whereNotNull('score')
            ->where('updated_at', '>=', $since)
            ->with('seatwork:id,title')
            ->latest()->limit((int) config('gamification.notification_limit_student_other'))->get() as $a) {
            $notifs[] = [
                'id' => 'seatwork_result_' . $a->id,
                'type' => 'seatwork',
                'title' => 'Seatwork graded',
                'body' => "{$a->seatwork->title} — Score: {$a->score}/{$a->total_points}",
                'link' => route('student.seatworks.result', $a->id),
                'time' => $a->updated_at,
            ];
        }

        // Exams
        foreach (ExamAttempt::where('student_id', $user->id)
            ->where('status', \App\Enums\AttemptStatus::Submitted->value)->whereNotNull('total_score')
            ->where('updated_at', '>=', $since)
            ->with('exam:id,title')
            ->latest()->limit((int) config('gamification.notification_limit_student_other'))->get() as $a) {
            $notifs[] = [
                'id' => 'exam_result_' . $a->id,
                'type' => 'exam',
                'title' => 'Exam graded',
                'body' => "{$a->exam->title} — Score: {$a->total_score}",
                'link' => route('student.exams.result', $a->id),
                'time' => $a->updated_at,
            ];
        }

        return $notifs;
    }
}
