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
use App\Models\Section;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TeacherController extends Controller
{
    public function dashboard(): Response
    {
        $teacher = Auth::user();

        if ($teacher->isSuperadmin()) {
            $quizIds = Quiz::pluck('id');
            $seatworkIds = Seatwork::pluck('id');
            $examIds = Exam::pluck('id');
            $practicalIds = Practical::pluck('id');
            $studentIds = User::where('role', 'student')->pluck('id');
        } else {
            $quizIds = $teacher->quizzes()->pluck('id');
            $seatworkIds = $teacher->seatworks()->pluck('id');
            $examIds = $teacher->exams()->pluck('id');
            $practicalIds = $teacher->practicals()->pluck('id');
            $studentIds = $teacher->students()->pluck('users.id');
        }

        $studentCount = $studentIds->count();
        $totalActivities = $quizIds->count() + $seatworkIds->count() + $examIds->count() + $practicalIds->count();

        // Submitted attempts
        $quizAttempts = QuizAttempt::whereIn('quiz_id', $quizIds)->where('status', 'submitted')
            ->with('student:id,name', 'quiz:id,title')->get(['id', 'quiz_id', 'student_id', 'score', 'total_points', 'submitted_at']);
        $seatworkAttempts = SeatworkAttempt::whereIn('seatwork_id', $seatworkIds)->where('status', 'submitted')
            ->with('student:id,name', 'seatwork:id,title')->get(['id', 'seatwork_id', 'student_id', 'score', 'total_points', 'submitted_at']);
        $examAttempts = ExamAttempt::whereIn('exam_id', $examIds)->where('status', 'submitted')
            ->with('student:id,name', 'exam:id,title,max_score')->get(['id', 'exam_id', 'student_id', 'total_score', 'submitted_at']);
        $practicalAttempts = PracticalAttempt::whereIn('practical_id', $practicalIds)->where('status', 'submitted')->whereNotNull('total_score')
            ->with('student:id,name', 'practical:id,title,max_score')->get(['id', 'practical_id', 'student_id', 'total_score', 'submitted_at']);

        $totalSubmissions = $quizAttempts->count() + $seatworkAttempts->count() + $examAttempts->count() + $practicalAttempts->count();

        // Averages
        $quizAvg = $this->calcAvg($quizAttempts, 'score', 'total_points');
        $seatworkAvg = $this->calcAvg($seatworkAttempts, 'score', 'total_points');
        $examAvg = $this->calcAvg($examAttempts, 'total_score', 'exam.max_score');
        $practicalAvg = $this->calcAvg($practicalAttempts, 'total_score', 'practical.max_score');

        $allScore = 0;
        $allMax = 0;
        foreach ($quizAttempts as $a) { $allScore += $a->score; $allMax += $a->total_points; }
        foreach ($seatworkAttempts as $a) { $allScore += $a->score; $allMax += $a->total_points; }
        foreach ($examAttempts as $a) { $allScore += $a->total_score; $allMax += ($a->exam->max_score ?? 0); }
        foreach ($practicalAttempts as $a) { $allScore += $a->total_score; $allMax += ($a->practical->max_score ?? 0); }
        $overallAvg = $allMax > 0 ? round(($allScore / $allMax) * 100, 1) : 0;

        // Completion rates
        $quizSubmitted = $quizAttempts->pluck('student_id')->unique()->count();
        $seatworkSubmitted = $seatworkAttempts->pluck('student_id')->unique()->count();
        $examSubmitted = $examAttempts->pluck('student_id')->unique()->count();
        $practicalSubmitted = $practicalAttempts->pluck('student_id')->unique()->count();

        // Recent activity
        $recent = collect();
        foreach ($quizAttempts as $a) {
            $pct = $a->total_points > 0 ? round(($a->score / $a->total_points) * 100, 1) : 0;
            $recent->push(['type' => 'Quiz', 'title' => $a->quiz->title, 'student' => $a->student->name, 'score' => $a->score, 'total' => $a->total_points, 'pct' => $pct, 'submitted_at' => $a->submitted_at?->toDateTimeString()]);
        }
        foreach ($seatworkAttempts as $a) {
            $pct = $a->total_points > 0 ? round(($a->score / $a->total_points) * 100, 1) : 0;
            $recent->push(['type' => 'Seatwork', 'title' => $a->seatwork->title, 'student' => $a->student->name, 'score' => $a->score, 'total' => $a->total_points, 'pct' => $pct, 'submitted_at' => $a->submitted_at?->toDateTimeString()]);
        }
        foreach ($examAttempts as $a) {
            $max = $a->exam->max_score ?? 0;
            $pct = $max > 0 ? round(($a->total_score / $max) * 100, 1) : 0;
            $recent->push(['type' => 'Exam', 'title' => $a->exam->title, 'student' => $a->student->name, 'score' => $a->total_score, 'total' => $max, 'pct' => $pct, 'submitted_at' => $a->submitted_at?->toDateTimeString()]);
        }
        foreach ($practicalAttempts as $a) {
            $max = $a->practical->max_score ?? 0;
            $pct = $max > 0 ? round(($a->total_score / $max) * 100, 1) : 0;
            $recent->push(['type' => 'Practical', 'title' => $a->practical->title, 'student' => $a->student->name, 'score' => $a->total_score, 'total' => $max, 'pct' => $pct, 'submitted_at' => $a->submitted_at?->toDateTimeString()]);
        }
        $recent = $recent->sortByDesc('submitted_at')->take(10)->values();

        return Inertia::render('Teacher/Dashboard', [
            'totalSubmissions' => $totalSubmissions,
            'totalActivities' => $totalActivities,
            'studentCount' => $studentCount,
            'overallAvg' => $overallAvg,
            'typeAverages' => ['Quiz' => $quizAvg, 'Exam' => $examAvg, 'Seatwork' => $seatworkAvg, 'Practical' => $practicalAvg],
            'typeSubmissions' => ['Quiz' => $quizAttempts->count(), 'Exam' => $examAttempts->count(), 'Seatwork' => $seatworkAttempts->count(), 'Practical' => $practicalAttempts->count()],
            'recentActivity' => $recent,
            'isSuperadmin' => $teacher->isSuperadmin(),
        ]);
    }

    private function calcAvg($attempts, string $scoreField, ?string $maxField): float
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

    public function teachers(): Response
    {
        $teacher = Auth::user();
        abort_unless($teacher->isSuperadmin(), 403);

        $teachers = User::where('role', 'teacher')
            ->withCount('students')
            ->withCount('quizzes')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'created_at']);

        return Inertia::render('Teacher/Teachers', [
            'teachers' => $teachers,
        ]);
    }

    public function teacherShow(User $user): Response
    {
        $teacher = Auth::user();
        abort_unless($teacher->isSuperadmin(), 403);
        abort_unless($user->isTeacher(), 404);

        $studentIds = $user->students()->pluck('users.id');
        $students = User::whereIn('id', $studentIds)
            ->with('section:id,name')
            ->orderBy('grade')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'grade', 'section_id', 'created_at']);

        return Inertia::render('Teacher/TeacherShow', [
            'teacher' => $user->only(['id', 'name', 'email']),
            'students' => $students,
        ]);
    }

    public function teacherUpdate(Request $request, User $user): RedirectResponse
    {
        $teacher = Auth::user();
        abort_unless($teacher->isSuperadmin(), 403);
        abort_unless($user->isTeacher(), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->update($validated);

        return back()->with('success', 'Teacher updated successfully.');
    }

    public function studentScores(User $user): JsonResponse
    {
        $teacher = Auth::user();
        $isAssigned = $teacher->isSuperadmin() || $teacher->students()->where('users.id', $user->id)->exists();
        abort_unless($isAssigned, 403);
        abort_unless($user->isStudent(), 404);

        $attempts = QuizAttempt::where('student_id', $user->id)
            ->with('quiz:id,title,grade_levels')
            ->orderByDesc('created_at')
            ->get(['id', 'quiz_id', 'score', 'total_points', 'status', 'created_at']);

        return response()->json(['attempts' => $attempts]);
    }

    public function studentUpdate(Request $request, User $user): RedirectResponse
    {
        $teacher = Auth::user();
        $isAssigned = $teacher->isSuperadmin() || $teacher->students()->where('users.id', $user->id)->exists();
        abort_unless($isAssigned, 403);
        abort_unless($user->isStudent(), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->update($validated);

        return back()->with('success', 'Student updated successfully.');
    }

    public function studentRemove(User $user): RedirectResponse
    {
        $teacher = Auth::user();
        $isAssigned = $teacher->isSuperadmin() || $teacher->students()->where('users.id', $user->id)->exists();
        abort_unless($isAssigned, 403);
        abort_unless($user->isStudent(), 404);

        $user->teachers()->detach($teacher->id);

        return back()->with('success', 'Student removed from class.');
    }

    public function students(): Response
    {
        $teacher = Auth::user();

        if ($teacher->isSuperadmin()) {
            $students = User::where('role', 'student')
                ->with('section:id,name')
                ->with('teachers:id,name')
                ->withCount(['quizAttempts as completed_quizzes_count' => function ($query) {
                    $query->where('status', 'submitted');
                }])
                ->orderBy('grade')
                ->orderBy('name')
                ->get();
        } else {
            $studentIds = $teacher->students()->pluck('users.id');
            $students = User::whereIn('id', $studentIds)
                ->with('section:id,name')
                ->with('teachers:id,name')
                ->withCount(['quizAttempts as completed_quizzes_count' => function ($query) {
                    $query->where('status', 'submitted');
                }])
                ->orderBy('grade')
                ->orderBy('name')
                ->get();
        }

        return Inertia::render('Teacher/Students', [
            'students' => $students,
            'isSuperadmin' => $teacher->isSuperadmin(),
        ]);
    }

    public function results(): Response
    {
        $teacher = Auth::user();

        $studentIds = $teacher->isSuperadmin()
            ? null
            : $teacher->students()->pluck('users.id');

        $baseQuery = fn ($q) => $studentIds === null ? $q : $q->whereIn('student_id', $studentIds);

        $quizAttempts = $baseQuery(QuizAttempt::with(['quiz:id,title,teacher_id', 'quiz.teacher:id,name', 'student:id,name,grade'])
            ->where('status', 'submitted'))
            ->latest('submitted_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'activity_id' => $a->quiz_id,
                'type' => 'Quiz',
                'teacher_id' => $a->quiz->teacher_id,
                'teacher_name' => $a->quiz->teacher->name ?? null,
                'student_name' => $a->student->name,
                'student_grade' => $a->student->grade,
                'title' => $a->quiz->title,
                'score' => $a->score,
                'total' => $a->total_points,
                'percentage' => $a->total_points ? round(($a->score / $a->total_points) * 100) : 0,
                'submitted_at' => $a->submitted_at,
            ]);

        $seatworkAttempts = $baseQuery(SeatworkAttempt::with(['seatwork:id,title,teacher_id', 'seatwork.teacher:id,name', 'student:id,name,grade'])
            ->where('status', 'submitted'))
            ->latest('submitted_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'activity_id' => $a->seatwork_id,
                'type' => 'Seatwork',
                'teacher_id' => $a->seatwork->teacher_id,
                'teacher_name' => $a->seatwork->teacher->name ?? null,
                'student_name' => $a->student->name,
                'student_grade' => $a->student->grade,
                'title' => $a->seatwork->title,
                'score' => $a->score,
                'total' => $a->total_points,
                'percentage' => $a->total_points ? round(($a->score / $a->total_points) * 100) : 0,
                'submitted_at' => $a->submitted_at,
            ]);

        $practicalAttempts = $baseQuery(PracticalAttempt::with(['practical:id,title,max_score,teacher_id', 'practical.teacher:id,name', 'student:id,name,grade'])
            ->where('status', 'submitted'))
            ->latest('submitted_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'activity_id' => $a->practical_id,
                'type' => 'Practical',
                'teacher_id' => $a->practical->teacher_id,
                'teacher_name' => $a->practical->teacher->name ?? null,
                'student_name' => $a->student->name,
                'student_grade' => $a->student->grade,
                'title' => $a->practical->title,
                'score' => $a->total_score,
                'total' => $a->practical->max_score,
                'percentage' => $a->practical->max_score ? round(($a->total_score / $a->practical->max_score) * 100) : 0,
                'submitted_at' => $a->submitted_at,
            ]);

        $examAttempts = $baseQuery(ExamAttempt::with(['exam:id,title,max_score,teacher_id', 'exam.teacher:id,name', 'student:id,name,grade'])
            ->where('status', 'submitted'))
            ->latest('submitted_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'activity_id' => $a->exam_id,
                'type' => 'Exam',
                'teacher_id' => $a->exam->teacher_id,
                'teacher_name' => $a->exam->teacher->name ?? null,
                'student_name' => $a->student->name,
                'student_grade' => $a->student->grade,
                'title' => $a->exam->title,
                'score' => $a->total_score,
                'total' => $a->exam->max_score,
                'percentage' => $a->exam->max_score ? round(($a->total_score / $a->exam->max_score) * 100) : 0,
                'submitted_at' => $a->submitted_at,
            ]);

        $all = collect($quizAttempts)
            ->concat($seatworkAttempts)
            ->concat($practicalAttempts)
            ->concat($examAttempts)
            ->sortByDesc('submitted_at')
            ->values();

        $data = ['activities' => $all];

        if ($teacher->isSuperadmin()) {
            $data['teachersList'] = User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']);
        }

        return Inertia::render('Teacher/Results', $data);
    }

    public function leaderboard(): Response
    {
        $teacher = Auth::user();

        $studentIds = $teacher->isSuperadmin()
            ? null
            : $teacher->students()->pluck('users.id');

        $students = User::where('role', 'student')
            ->when($studentIds, fn ($q) => $q->whereIn('id', $studentIds))
            ->with('section:id,name', 'gradeLevel:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'grade', 'grade_level_id', 'section_id']);

        $studentIdList = $students->pluck('id');

        $quizAgg = QuizAttempt::whereIn('student_id', $studentIdList)
            ->where('status', 'submitted')
            ->select('student_id', DB::raw('COALESCE(SUM(score), 0) as score'), DB::raw('COALESCE(SUM(total_points), 0) as total'))
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        $seatworkAgg = SeatworkAttempt::whereIn('student_id', $studentIdList)
            ->where('status', 'submitted')
            ->select('student_id', DB::raw('COALESCE(SUM(score), 0) as score'), DB::raw('COALESCE(SUM(total_points), 0) as total'))
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        $practicalAgg = PracticalAttempt::whereIn('student_id', $studentIdList)
            ->where('status', 'submitted')
            ->with('practical:id,max_score')
            ->get()
            ->groupBy('student_id')
            ->map(fn ($attempts) => [
                'score' => $attempts->sum('total_score'),
                'total' => $attempts->sum(fn ($a) => $a->practical?->max_score ?? 0),
            ]);

        $examAgg = ExamAttempt::whereIn('student_id', $studentIdList)
            ->where('status', 'submitted')
            ->with('exam:id,max_score')
            ->get()
            ->groupBy('student_id')
            ->map(fn ($attempts) => [
                'score' => $attempts->sum('total_score'),
                'total' => $attempts->sum(fn ($a) => $a->exam?->max_score ?? 0),
            ]);

        $entries = $students->map(function ($student) use ($quizAgg, $seatworkAgg, $practicalAgg, $examAgg) {
            $quiz = $quizAgg->get($student->id);
            $seatwork = $seatworkAgg->get($student->id);
            $practical = $practicalAgg->get($student->id);
            $exam = $examAgg->get($student->id);

            $quizPct = $quiz && $quiz->total > 0 ? round(($quiz->score / $quiz->total) * 100) : null;
            $seatworkPct = $seatwork && $seatwork->total > 0 ? round(($seatwork->score / $seatwork->total) * 100) : null;
            $practicalPct = $practical && $practical['total'] > 0 ? round(($practical['score'] / $practical['total']) * 100) : null;
            $examPct = $exam && $exam['total'] > 0 ? round(($exam['score'] / $exam['total']) * 100) : null;

            $allScore = ($quiz?->score ?? 0) + ($seatwork?->score ?? 0) + ($practical['score'] ?? 0) + ($exam['score'] ?? 0);
            $allTotal = ($quiz?->total ?? 0) + ($seatwork?->total ?? 0) + ($practical['total'] ?? 0) + ($exam['total'] ?? 0);
            $overall = $allTotal > 0 ? round(($allScore / $allTotal) * 100) : null;

            return [
                'id' => $student->id,
                'name' => $student->name,
                'grade' => $student->grade,
                'grade_level_name' => $student->gradeLevel?->name,
                'section_name' => $student->section?->name,
                'section_id' => $student->section_id,
                'grade_level_id' => $student->grade_level_id,
                'quiz' => $quizPct,
                'seatwork' => $seatworkPct,
                'practical' => $practicalPct,
                'exam' => $examPct,
                'overall' => $overall,
            ];
        })->sortByDesc('overall')->values();

        $sections = Section::whereIn('id', $students->pluck('section_id')->filter())
            ->orderBy('name')
            ->get(['id', 'name', 'grade_level_id']);

        $gradeLevels = $students->pluck('gradeLevel')
            ->filter()
            ->unique('id')
            ->sortBy('display_order')
            ->values();

        return Inertia::render('Teacher/Leaderboard', [
            'entries' => $entries,
            'sections' => $sections,
            'gradeLevels' => $gradeLevels,
        ]);
    }

    public function destroyAttempt(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:Quiz,Seatwork,Practical,Exam'],
            'id' => ['required', 'integer'],
        ]);

        $modelMap = [
            'Quiz' => QuizAttempt::class,
            'Seatwork' => SeatworkAttempt::class,
            'Practical' => PracticalAttempt::class,
            'Exam' => ExamAttempt::class,
        ];

        $teacher = Auth::user();
        $modelClass = $modelMap[$data['type']];
        $attempt = $modelClass::findOrFail($data['id']);

        $activityRel = strtolower($data['type']);
        $attempt->load($activityRel);
        $attemptActivity = $attempt->$activityRel;
        abort_unless($teacher->isSuperadmin() || $attemptActivity?->teacher_id === $teacher->id, 403);

        if ($attempt instanceof PracticalAttempt) {
            $attempt->scores()->delete();
        }

        $attempt->delete();

        return redirect()->back()->with('success', 'Attempt deleted. Student can retake.');
    }
}
