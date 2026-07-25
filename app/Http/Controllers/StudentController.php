<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Practical;
use App\Models\PracticalAttempt;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Seatwork;
use App\Models\SeatworkAttempt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function dashboard(): Response
    {
        $student = Auth::user();
        $teacherIds = $student->teachers()->pluck('users.id');

        $quizBase = Quiz::whereIn('teacher_id', $teacherIds)->where('is_published', true);
        $quizBase->where(function ($q) use ($student) {
            if ($student->grade_level_id) {
                $q->whereHas('gradeLevels', fn ($sq) => $sq->where('grade_level_id', $student->grade_level_id));
            }
            if ($student->grade) {
                $q->orWhere('grade', $student->grade);
            }
        });

        $quizIds = $quizBase->pluck('id');
        $examIds = Exam::whereIn('teacher_id', $teacherIds)->where('is_published', true)
            ->has('sections')->pluck('id');
        $seatworkIds = Seatwork::whereIn('teacher_id', $teacherIds)->where('is_published', true)->pluck('id');
        $practicalIds = Practical::whereIn('teacher_id', $teacherIds)->where('is_published', true)->pluck('id');

        $quizTotal = $quizIds->count();
        $examTotal = $examIds->count();
        $seatworkTotal = $seatworkIds->count();
        $practicalTotal = $practicalIds->count();

        $quizAttempts = QuizAttempt::whereIn('quiz_id', $quizIds)
            ->where('student_id', $student->id)->where('status', 'submitted')
            ->with('quiz:id,title')->get(['id', 'quiz_id', 'score', 'total_points', 'submitted_at']);
        $seatworkAttempts = SeatworkAttempt::whereIn('seatwork_id', $seatworkIds)
            ->where('student_id', $student->id)->where('status', 'submitted')
            ->with('seatwork:id,title')->get(['id', 'seatwork_id', 'score', 'total_points', 'submitted_at']);
        $examAttempts = ExamAttempt::whereIn('exam_id', $examIds)
            ->where('student_id', $student->id)->where('status', 'submitted')
            ->with('exam:id,title,max_score')->get(['id', 'exam_id', 'total_score', 'submitted_at']);
        $practicalAttempts = PracticalAttempt::whereIn('practical_id', $practicalIds)
            ->where('student_id', $student->id)->where('status', 'submitted')->whereNotNull('total_score')
            ->with('practical:id,title,max_score')->get(['id', 'practical_id', 'total_score', 'submitted_at']);

        $quizSubmitted = $quizAttempts->count();
        $examSubmitted = $examAttempts->count();
        $seatworkSubmitted = $seatworkAttempts->count();
        $practicalSubmitted = $practicalAttempts->count();

        $quizAvg = static::calcAvg($quizAttempts, 'score', 'total_points');
        $seatworkAvg = static::calcAvg($seatworkAttempts, 'score', 'total_points');
        $examAvg = static::calcAvg($examAttempts, 'total_score', 'exam.max_score');
        $practicalAvg = static::calcAvg($practicalAttempts, 'total_score', 'practical.max_score');

        $allScore = 0;
        $allMax = 0;
        foreach ($quizAttempts as $a) { $allScore += $a->score; $allMax += $a->total_points; }
        foreach ($seatworkAttempts as $a) { $allScore += $a->score; $allMax += $a->total_points; }
        foreach ($examAttempts as $a) { $allScore += $a->total_score; $allMax += ($a->exam->max_score ?? 0); }
        foreach ($practicalAttempts as $a) { $allScore += $a->total_score; $allMax += ($a->practical->max_score ?? 0); }
        $overallAvg = $allMax > 0 ? round(($allScore / $allMax) * 100, 1) : 0;

        $pendingCount = ($quizTotal - $quizSubmitted) + ($examTotal - $examSubmitted)
            + ($seatworkTotal - $seatworkSubmitted) + ($practicalTotal - $practicalSubmitted);

        $recent = collect();
        foreach ($quizAttempts as $a) {
            $pct = $a->total_points > 0 ? round(($a->score / $a->total_points) * 100, 1) : 0;
            $recent->push(['type' => 'Quiz', 'title' => $a->quiz->title, 'score' => $a->score, 'total' => $a->total_points, 'pct' => $pct, 'submitted_at' => $a->submitted_at?->toDateTimeString()]);
        }
        foreach ($seatworkAttempts as $a) {
            $pct = $a->total_points > 0 ? round(($a->score / $a->total_points) * 100, 1) : 0;
            $recent->push(['type' => 'Seatwork', 'title' => $a->seatwork->title, 'score' => $a->score, 'total' => $a->total_points, 'pct' => $pct, 'submitted_at' => $a->submitted_at?->toDateTimeString()]);
        }
        foreach ($examAttempts as $a) {
            $max = $a->exam->max_score ?? 0;
            $pct = $max > 0 ? round(($a->total_score / $max) * 100, 1) : 0;
            $recent->push(['type' => 'Exam', 'title' => $a->exam->title, 'score' => $a->total_score, 'total' => $max, 'pct' => $pct, 'submitted_at' => $a->submitted_at?->toDateTimeString()]);
        }
        foreach ($practicalAttempts as $a) {
            $max = $a->practical->max_score ?? 0;
            $pct = $max > 0 ? round(($a->total_score / $max) * 100, 1) : 0;
            $recent->push(['type' => 'Practical', 'title' => $a->practical->title, 'score' => $a->total_score, 'total' => $max, 'pct' => $pct, 'submitted_at' => $a->submitted_at?->toDateTimeString()]);
        }
        $recent = $recent->sortByDesc('submitted_at')->take(5)->values();

        return Inertia::render('Student/Dashboard', [
            'overallAvg' => $overallAvg,
            'typeAverages' => ['Quiz' => $quizAvg, 'Exam' => $examAvg, 'Seatwork' => $seatworkAvg, 'Practical' => $practicalAvg],
            'pendingCount' => $pendingCount,
            'recentResults' => $recent,
            'stats' => [
                'quizzes' => ['total' => $quizTotal, 'submitted' => $quizSubmitted],
                'exams' => ['total' => $examTotal, 'submitted' => $examSubmitted],
                'seatworks' => ['total' => $seatworkTotal, 'submitted' => $seatworkSubmitted],
                'practicals' => ['total' => $practicalTotal, 'submitted' => $practicalSubmitted],
            ],
        ]);
    }

    private static function calcAvg($attempts, string $scoreField, ?string $maxField): float
    {
        $totalScore = 0;
        $totalMax = 0;
        foreach ($attempts as $a) {
            $score = (float) ($a->{$scoreField} ?? 0);
            $max = $maxField ? (float) (str_contains($maxField, '.') ? data_get($a, $maxField) : ($a->{$maxField} ?? 0)) : 0;
            if ($max > 0) { $totalScore += $score; $totalMax += $max; }
        }
        return $totalMax > 0 ? round(($totalScore / $totalMax) * 100, 1) : 0;
    }

    public function take(Quiz $quiz): Response|RedirectResponse
    {
        $student = Auth::user();
        $this->authorizeAccess($quiz, $student);

        $existing = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('student_id', $student->id)
            ->first();

        if ($existing && $existing->status === 'submitted') {
            return redirect()->route('student.dashboard')
                ->with('info', 'You have already submitted this quiz.');
        }

        if (! $existing) {
            $existing = QuizAttempt::create([
                'quiz_id' => $quiz->id,
                'student_id' => $student->id,
                'status' => 'in_progress',
                'started_at' => now(),
                'total_points' => $quiz->totalPoints(),
            ]);
        }

        $quiz->load(['questions' => function ($query) {
            $query->inRandomOrder();
        }, 'questions.options' => function ($query) {
            $query->inRandomOrder();
        }]);

        return Inertia::render('Student/Quiz/Take', [
            'quiz' => $quiz,
            'startedAt' => $existing->started_at,
        ]);
    }

    public function submit(Request $request, Quiz $quiz): RedirectResponse
    {
        $student = Auth::user();
        $this->authorizeAccess($quiz, $student);

        $data = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*' => ['nullable', 'integer', 'exists:quiz_options,id'],
        ]);

        $attempt = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('student_id', $student->id)
            ->firstOrFail();

        if ($attempt->status === 'submitted') {
            return redirect()->route('student.dashboard')->with('info', 'This quiz was already submitted.');
        }

        $quiz->load('questions.options');

        $score = 0;

        DB::transaction(function () use ($quiz, $data, $attempt, &$score) {
            foreach ($quiz->questions as $question) {
                $selectedOptionId = $data['answers'][$question->id] ?? null;
                $selectedOption = $question->options->firstWhere('id', $selectedOptionId);
                $isCorrect = (bool) ($selectedOption?->is_correct);

                if ($isCorrect) {
                    $score += $question->points;
                }

                DB::table('quiz_answers')->updateOrInsert(
                    ['quiz_attempt_id' => $attempt->id, 'question_id' => $question->id],
                    [
                        'quiz_option_id' => $selectedOptionId,
                        'is_correct' => $isCorrect,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }

            DB::table('quiz_attempts')->where('id', $attempt->id)->update([
                'score' => $score,
                'total_points' => $quiz->totalPoints(),
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);
        });

        return redirect()->route('student.quizzes.result', ['attempt' => $attempt->id])
            ->with('success', 'Quiz submitted successfully.');
    }

    public function result(QuizAttempt $attempt): Response
    {
        $student = Auth::user();

        if ($attempt->student_id !== $student->id) {
            abort(403);
        }

        $attempt->load(['quiz.questions' => function ($q) {
            $q->orderBy('order');
        }, 'quiz.questions.options', 'answers.selectedOption']);

        return Inertia::render('Student/Quiz/Result', [
            'attempt' => $attempt,
        ]);
    }

    public function quizzes(): Response
    {
        $student = Auth::user();
        $teacherIds = $student->teachers()->pluck('users.id');

        $quizzes = Quiz::query()
            ->whereIn('teacher_id', $teacherIds)
            ->where('is_published', true);

        $quizzes->where(function ($q) use ($student) {
            if ($student->grade_level_id) {
                $q->whereHas('gradeLevels', fn ($sq) => $sq->where('grade_level_id', $student->grade_level_id));
            }
            if ($student->grade) {
                $q->orWhere('grade', $student->grade);
            }
        });

        $quizzes = $quizzes->withCount('questions')
            ->with(['attempts' => function ($query) use ($student) {
                $query->where('student_id', $student->id);
            }])
            ->latest()
            ->get()
            ->map(function ($quiz) {
                $attempt = $quiz->attempts->first();
                return [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'questions_count' => $quiz->questions_count,
                    'time_limit_minutes' => $quiz->time_limit_minutes,
                    'status' => $attempt ? $attempt->status : 'not_started',
                    'score' => $attempt?->score,
                    'total_points' => $attempt?->total_points,
                    'attempt_id' => $attempt?->id,
                ];
            });

        return Inertia::render('Student/Quizzes/Index', ['quizzes' => $quizzes]);
    }

    public function seatworks(): Response
    {
        $student = Auth::user();
        $teacherIds = $student->teachers()->pluck('users.id');

        $seatworks = Seatwork::whereIn('teacher_id', $teacherIds)
            ->where('is_published', true)
            ->with(['attempts' => function ($query) use ($student) {
                $query->where('student_id', $student->id);
            }])
            ->withCount('questions')
            ->latest()
            ->get()
            ->map(function ($seatwork) {
                $attempt = $seatwork->attempts->first();
                return [
                    'id' => $seatwork->id,
                    'title' => $seatwork->title,
                    'questions_count' => $seatwork->questions_count,
                    'time_limit_minutes' => $seatwork->time_limit_minutes,
                    'status' => $attempt ? $attempt->status : 'not_started',
                    'score' => $attempt?->score,
                    'total_points' => $attempt?->total_points,
                    'attempt_id' => $attempt?->id,
                ];
            });

        return Inertia::render('Student/Seatworks/Index', ['seatworks' => $seatworks]);
    }

    public function practicals(): Response
    {
        $student = Auth::user();
        $teacherIds = $student->teachers()->pluck('users.id');

        $practicals = Practical::whereIn('teacher_id', $teacherIds)
            ->where('is_published', true)
            ->with(['attempts' => function ($query) use ($student) {
                $query->where('student_id', $student->id);
            }])
            ->withCount('criteria')
            ->latest()
            ->get()
            ->map(function ($practical) {
                $attempt = $practical->attempts->first();
                return [
                    'id' => $practical->id,
                    'title' => $practical->title,
                    'criteria_count' => $practical->criteria_count,
                    'time_limit_minutes' => $practical->time_limit_minutes,
                    'max_score' => $practical->max_score,
                    'status' => $attempt ? $attempt->status : 'not_started',
                    'score' => $attempt?->total_score,
                    'attempt_id' => $attempt?->id,
                ];
            });

        return Inertia::render('Student/Practicals/Index', ['practicals' => $practicals]);
    }

    public function exams(): Response
    {
        $student = Auth::user();
        $teacherIds = $student->teachers()->pluck('users.id');

        $exams = Exam::whereIn('teacher_id', $teacherIds)
            ->where('is_published', true)
            ->with(['attempts' => function ($query) use ($student) {
                $query->where('student_id', $student->id);
            }])
            ->withCount('sections')
            ->latest()
            ->get()
            ->map(function ($exam) {
                $attempt = $exam->attempts->first();
                return [
                    'id' => $exam->id,
                    'title' => $exam->title,
                    'instructions' => $exam->instructions,
                    'sections_count' => $exam->sections_count,
                    'time_limit_minutes' => $exam->time_limit_minutes,
                    'max_score' => $exam->max_score,
                    'status' => $attempt ? $attempt->status : 'not_started',
                    'score' => $attempt?->total_score,
                    'attempt_id' => $attempt?->id,
                ];
            })
            ->filter(fn ($e) => $e['sections_count'] > 0)
            ->values();

        return Inertia::render('Student/Exams/Index', ['exams' => $exams]);
    }

    public function results(): Response
    {
        $student = Auth::user();

        $quizAttempts = QuizAttempt::with('quiz:id,title,grade')
            ->where('student_id', $student->id)
            ->where('status', 'submitted')
            ->latest('submitted_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'type' => 'Quiz',
                'title' => $a->quiz->title,
                'score' => $a->score,
                'total' => $a->total_points,
                'percentage' => $a->total_points ? round(($a->score / $a->total_points) * 100) : 0,
                'submitted_at' => $a->submitted_at,
                'resultUrl' => "/student/quizzes/{$a->id}/result",
            ]);

        $seatworkAttempts = \App\Models\SeatworkAttempt::with('seatwork:id,title')
            ->where('student_id', $student->id)
            ->where('status', 'submitted')
            ->latest('submitted_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'type' => 'Seatwork',
                'title' => $a->seatwork->title,
                'score' => $a->score,
                'total' => $a->total_points,
                'percentage' => $a->total_points ? round(($a->score / $a->total_points) * 100) : 0,
                'submitted_at' => $a->submitted_at,
                'resultUrl' => "/student/seatworks/{$a->id}/result",
            ]);

        $practicalAttempts = \App\Models\PracticalAttempt::with('practical:id,title')
            ->where('student_id', $student->id)
            ->where('status', 'submitted')
            ->latest('submitted_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'type' => 'Practical',
                'title' => $a->practical->title,
                'score' => $a->total_score,
                'total' => $a->practical->max_score,
                'percentage' => $a->practical->max_score ? round(($a->total_score / $a->practical->max_score) * 100) : 0,
                'submitted_at' => $a->submitted_at,
                'resultUrl' => "/student/practicals/{$a->id}/result",
            ]);

        $examAttempts = \App\Models\ExamAttempt::with('exam:id,title,max_score')
            ->where('student_id', $student->id)
            ->where('status', 'submitted')
            ->latest('submitted_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'type' => 'Exam',
                'title' => $a->exam->title,
                'score' => $a->total_score,
                'total' => $a->exam->max_score,
                'percentage' => $a->exam->max_score ? round(($a->total_score / $a->exam->max_score) * 100) : 0,
                'submitted_at' => $a->submitted_at,
                'resultUrl' => "/student/exams/{$a->id}/result",
            ]);

        $all = collect($quizAttempts)
            ->concat($seatworkAttempts)
            ->concat($practicalAttempts)
            ->concat($examAttempts)
            ->sortByDesc('submitted_at')
            ->values();

        return Inertia::render('Student/Results', [
            'activities' => $all,
        ]);
    }

    private function authorizeAccess(Quiz $quiz, $student): void
    {
        $hasGrade = $quiz->gradeLevels()->exists()
            ? $quiz->gradeLevels()->where('grade_level_id', $student->grade_level_id)->exists()
            : $quiz->grade === $student->grade;

        $teacherIds = $student->teachers()->pluck('users.id');

        if (
            ! in_array($quiz->teacher_id, $teacherIds->toArray()) ||
            ! $quiz->is_published ||
            ! $hasGrade
        ) {
            abort(403, 'This quiz is not available to your account.');
        }
    }
}
