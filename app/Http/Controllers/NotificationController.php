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

        return response()->json([
            'notifications' => array_slice($notifications, 0, 30),
            'count' => count($notifications),
        ]);
    }

    private function teacherNotifications($user): array
    {
        $notifs = [];

        $isSuper = $user->isSuperadmin();

        // Practicals
        $practicalQuery = PracticalAttempt::where('status', 'submitted')->whereNull('total_score');
        if (!$isSuper) {
            $practicalQuery->whereIn('practical_id', $user->practicals()->pluck('id'));
        }
        foreach ($practicalQuery->with('practical:id,title', 'student:id,name')->latest()->limit(10)->get() as $a) {
            $notifs[] = [
                'id' => 'practical_' . $a->id,
                'type' => 'practical',
                'title' => 'Practical needs grading',
                'body' => "{$a->student->name} — {$a->practical->title}",
                'link' => "/teacher/practicals/{$a->practical_id}/grade/{$a->id}",
                'time' => $a->submitted_at,
            ];
        }

        // Quizzes
        $quizQuery = QuizAttempt::where('status', 'submitted')->whereNull('score');
        if (!$isSuper) {
            $quizQuery->whereIn('quiz_id', $user->quizzes()->pluck('id'));
        }
        foreach ($quizQuery->with('quiz:id,title', 'student:id,name')->latest()->limit(10)->get() as $a) {
            $notifs[] = [
                'id' => 'quiz_' . $a->id,
                'type' => 'quiz',
                'title' => 'Quiz needs grading',
                'body' => "{$a->student->name} — {$a->quiz->title}",
                'link' => "/teacher/quizzes/{$a->quiz_id}/recheck/{$a->id}",
                'time' => $a->submitted_at,
            ];
        }

        // Seatworks
        $swQuery = SeatworkAttempt::where('status', 'submitted')->whereNull('score');
        if (!$isSuper) {
            $swQuery->whereIn('seatwork_id', $user->seatworks()->pluck('id'));
        }
        foreach ($swQuery->with('seatwork:id,title', 'student:id,name')->latest()->limit(10)->get() as $a) {
            $notifs[] = [
                'id' => 'seatwork_' . $a->id,
                'type' => 'seatwork',
                'title' => 'Seatwork needs grading',
                'body' => "{$a->student->name} — {$a->seatwork->title}",
                'link' => "/teacher/seatworks/{$a->seatwork_id}/recheck/{$a->id}",
                'time' => $a->submitted_at,
            ];
        }

        // Exams
        $examQuery = ExamAttempt::where('status', 'submitted')->whereNull('total_score');
        if (!$isSuper) {
            $examQuery->whereIn('exam_id', $user->exams()->pluck('id'));
        }
        foreach ($examQuery->with('exam:id,title', 'student:id,name')->latest()->limit(10)->get() as $a) {
            $notifs[] = [
                'id' => 'exam_' . $a->id,
                'type' => 'exam',
                'title' => 'Exam needs grading',
                'body' => "{$a->student->name} — {$a->exam->title}",
                'link' => "/teacher/exams/{$a->exam_id}",
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
            ->where('status', 'submitted')->whereNotNull('total_score')
            ->where('updated_at', '>=', $since)
            ->with('practical:id,title')
            ->latest()->limit(5)->get() as $a) {
            $notifs[] = [
                'id' => 'practical_result_' . $a->id,
                'type' => 'practical',
                'title' => 'Practical graded',
                'body' => "{$a->practical->title} — Score: {$a->total_score}",
                'link' => "/student/practicals/{$a->id}/result",
                'time' => $a->updated_at,
            ];
        }

        // Quizzes
        foreach (QuizAttempt::where('student_id', $user->id)
            ->where('status', 'submitted')->whereNotNull('score')
            ->where('updated_at', '>=', $since)
            ->with('quiz:id,title')
            ->latest()->limit(5)->get() as $a) {
            $notifs[] = [
                'id' => 'quiz_result_' . $a->id,
                'type' => 'quiz',
                'title' => 'Quiz graded',
                'body' => "{$a->quiz->title} — Score: {$a->score}/{$a->total_points}",
                'link' => "/student/quizzes/{$a->id}/result",
                'time' => $a->updated_at,
            ];
        }

        // Seatworks
        foreach (SeatworkAttempt::where('student_id', $user->id)
            ->where('status', 'submitted')->whereNotNull('score')
            ->where('updated_at', '>=', $since)
            ->with('seatwork:id,title')
            ->latest()->limit(5)->get() as $a) {
            $notifs[] = [
                'id' => 'seatwork_result_' . $a->id,
                'type' => 'seatwork',
                'title' => 'Seatwork graded',
                'body' => "{$a->seatwork->title} — Score: {$a->score}/{$a->total_points}",
                'link' => "/student/seatworks/{$a->id}/result",
                'time' => $a->updated_at,
            ];
        }

        // Exams
        foreach (ExamAttempt::where('student_id', $user->id)
            ->where('status', 'submitted')->whereNotNull('total_score')
            ->where('updated_at', '>=', $since)
            ->with('exam:id,title')
            ->latest()->limit(5)->get() as $a) {
            $notifs[] = [
                'id' => 'exam_result_' . $a->id,
                'type' => 'exam',
                'title' => 'Exam graded',
                'body' => "{$a->exam->title} — Score: {$a->total_score}",
                'link' => "/student/exams/{$a->id}/result",
                'time' => $a->updated_at,
            ];
        }

        return $notifs;
    }
}
