<?php

namespace App\Http\Controllers;

use App\Models\GradeLevel;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\Section;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QuizController extends Controller
{
    public function index(): Response
    {
        $teacher = Auth::user();

        if ($teacher->isSuperadmin()) {
            $quizzes = Quiz::withCount('questions')
                ->withCount('attempts')
                ->with('gradeLevels:id,name', 'sections:id,name', 'teacher:id,name')
                ->latest()
                ->get();
        } else {
            $quizzes = $teacher->quizzes()
                ->withCount('questions')
                ->withCount('attempts')
                ->with('gradeLevels:id,name', 'sections:id,name')
                ->latest()
                ->get();
        }

        $gradeLevels = GradeLevel::where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name']);

        $allSections = Section::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'grade_level_id']);

        return Inertia::render('Teacher/Quizzes/Index', [
            'quizzes' => $quizzes,
            'gradeLevels' => $gradeLevels,
            'allSections' => $allSections,
            'isSuperadmin' => $teacher->isSuperadmin(),
        ]);
    }

    public function create(): Response
    {
        $teacher = Auth::user();

        $sections = $teacher->students()
            ->select('grade', 'section')
            ->distinct()
            ->orderBy('grade')
            ->orderBy('section')
            ->get();

        $gradeLevels = GradeLevel::where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name']);

        $allSections = Section::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'grade_level_id']);

        return Inertia::render('Teacher/Quizzes/Create', [
            'sections' => $sections,
            'gradeLevels' => $gradeLevels,
            'allSections' => $allSections,
            'teachers' => $teacher->isSuperadmin() ? User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'grade_level_ids' => ['required', 'array', 'min:1'],
            'grade_level_ids.*' => ['exists:grade_levels,id'],
            'section_ids' => ['required', 'array', 'min:1'],
            'section_ids.*' => ['exists:sections,id'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1'],
            'teacher_id' => ['nullable', 'exists:users,id'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.question_text' => ['required', 'string'],
            'questions.*.type' => ['required', 'in:multiple_choice,true_false'],
            'questions.*.points' => ['required', 'integer', 'min:1'],
            'questions.*.options' => ['required', 'array', 'min:2'],
            'questions.*.options.*.option_text' => ['required', 'string'],
            'questions.*.options.*.is_correct' => ['boolean'],
        ]);

        DB::transaction(function () use ($data) {
            $grade = GradeLevel::whereIn('id', $data['grade_level_ids'])->orderBy('display_order')->value('name');

            $teacherId = Auth::user()->isSuperadmin() && $data['teacher_id'] ? $data['teacher_id'] : Auth::id();

            $quiz = Quiz::create([
                'teacher_id' => $teacherId,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'grade' => $grade,
                'time_limit_minutes' => $data['time_limit_minutes'] ?? null,
                'is_published' => false,
            ]);

            $quiz->gradeLevels()->sync($data['grade_level_ids']);
            $quiz->sections()->sync($data['section_ids']);

            foreach ($data['questions'] as $qIndex => $question) {
                $createdQuestion = $quiz->questions()->create([
                    'question_text' => $question['question_text'],
                    'type' => $question['type'],
                    'points' => $question['points'],
                    'order' => $qIndex,
                ]);

                foreach ($question['options'] as $oIndex => $option) {
                    $createdQuestion->options()->create([
                        'option_text' => $option['option_text'],
                        'is_correct' => (bool) ($option['is_correct'] ?? false),
                        'order' => $oIndex,
                    ]);
                }
            }
        });

        return redirect()->route('teacher.dashboard')->with('success', 'Quiz created successfully.');
    }

    public function edit(Quiz $quiz): Response
    {
        $this->authorizeOwner($quiz);

        $quiz->load(['questions.options', 'gradeLevels', 'sections']);

        $teacher = Auth::user();

        $gradeLevels = GradeLevel::where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name']);

        $allSections = Section::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'grade_level_id']);

        return Inertia::render('Teacher/Quizzes/Edit', [
            'quiz' => $quiz,
            'gradeLevels' => $gradeLevels,
            'allSections' => $allSections,
            'teachers' => $teacher->isSuperadmin() ? User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function update(Request $request, Quiz $quiz): RedirectResponse
    {
        $this->authorizeOwner($quiz);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'grade_level_ids' => ['required', 'array', 'min:1'],
            'grade_level_ids.*' => ['exists:grade_levels,id'],
            'section_ids' => ['required', 'array', 'min:1'],
            'section_ids.*' => ['exists:sections,id'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1'],
            'teacher_id' => ['nullable', 'exists:users,id'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.id' => ['nullable', 'exists:questions,id'],
            'questions.*.question_text' => ['required', 'string'],
            'questions.*.type' => ['required', 'in:multiple_choice,true_false'],
            'questions.*.points' => ['required', 'integer', 'min:1'],
            'questions.*.options' => ['required', 'array', 'min:2'],
            'questions.*.options.*.id' => ['nullable', 'exists:quiz_options,id'],
            'questions.*.options.*.option_text' => ['required', 'string'],
            'questions.*.options.*.is_correct' => ['boolean'],
        ]);

        DB::transaction(function () use ($data, $quiz) {
            $grade = GradeLevel::whereIn('id', $data['grade_level_ids'])->orderBy('display_order')->value('name');

            $updateData = [
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'grade' => $grade,
                'time_limit_minutes' => $data['time_limit_minutes'] ?? null,
            ];

            if (Auth::user()->isSuperadmin() && $data['teacher_id']) {
                $updateData['teacher_id'] = $data['teacher_id'];
            }

            $quiz->update($updateData);

            $quiz->gradeLevels()->sync($data['grade_level_ids']);
            $quiz->sections()->sync($data['section_ids']);

            $existingQuestionIds = $quiz->questions()->pluck('id')->toArray();
            $submittedQuestionIds = [];

            foreach ($data['questions'] as $qIndex => $question) {
                if (! empty($question['id'])) {
                    $submittedQuestionIds[] = $question['id'];
                    $createdQuestion = $quiz->questions()->where('id', $question['id'])->first();

                    if ($createdQuestion) {
                        $createdQuestion->update([
                            'question_text' => $question['question_text'],
                            'type' => $question['type'],
                            'points' => $question['points'],
                            'order' => $qIndex,
                        ]);
                    }
                } else {
                    $createdQuestion = $quiz->questions()->create([
                        'question_text' => $question['question_text'],
                        'type' => $question['type'],
                        'points' => $question['points'],
                        'order' => $qIndex,
                    ]);
                }

                $existingOptionIds = $createdQuestion->options()->pluck('id')->toArray();
                $submittedOptionIds = [];

                foreach ($question['options'] as $oIndex => $option) {
                    if (! empty($option['id'])) {
                        $submittedOptionIds[] = $option['id'];
                        $existingOption = $createdQuestion->options()->where('id', $option['id'])->first();

                        if ($existingOption) {
                            $existingOption->update([
                                'option_text' => $option['option_text'],
                                'is_correct' => (bool) ($option['is_correct'] ?? false),
                                'order' => $oIndex,
                            ]);
                        }
                    } else {
                        $createdQuestion->options()->create([
                            'option_text' => $option['option_text'],
                            'is_correct' => (bool) ($option['is_correct'] ?? false),
                            'order' => $oIndex,
                        ]);
                    }
                }

                $optionsToDelete = array_diff($existingOptionIds, $submittedOptionIds);
                if (! empty($optionsToDelete)) {
                    $createdQuestion->options()->whereIn('id', $optionsToDelete)->delete();
                }
            }

            $questionsToDelete = array_diff($existingQuestionIds, $submittedQuestionIds);
            if (! empty($questionsToDelete)) {
                $quiz->questions()->whereIn('id', $questionsToDelete)->delete();
            }
        });

        return redirect()->route('teacher.quizzes.show', $quiz)->with('success', 'Quiz updated successfully.');
    }

    public function show(Quiz $quiz): Response
    {
        $this->authorizeOwner($quiz);

        $quiz->load(['questions.options', 'gradeLevels', 'sections']);

        $teacher = Auth::user();

        $attempts = $quiz->attempts()
            ->with('student:id,name,grade,section_id', 'student.section:id,name')
            ->where('status', 'submitted')
            ->orderByDesc('score')
            ->get();

        return Inertia::render('Teacher/Quizzes/Show', [
            'quiz' => $quiz,
            'attempts' => $attempts,
            'totalPoints' => $quiz->totalPoints(),
            'teachers' => $teacher->isSuperadmin() ? User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function autoRecheck(Quiz $quiz, QuizAttempt $attempt): RedirectResponse
    {
        $this->authorizeOwner($quiz);

        $quiz->load('questions.options');
        $attempt->load('answers');

        DB::transaction(function () use ($quiz, $attempt) {
            $score = 0;

            foreach ($attempt->answers as $answer) {
                $question = $quiz->questions->firstWhere('id', $answer->question_id);
                if (! $question) continue;

                $correctOption = $question->options->firstWhere('is_correct', true);
                $isCorrect = $correctOption && $answer->quiz_option_id === $correctOption->id;

                $answer->update(['is_correct' => $isCorrect]);

                if ($isCorrect) {
                    $score += $question->points;
                }
            }

            $attempt->update(['score' => $score]);
        });

        return back()->with('success', 'Quiz auto-rechecked successfully.');
    }

    public function recheck(Quiz $quiz, QuizAttempt $attempt): Response
    {
        $this->authorizeOwner($quiz);

        $attempt->load(['student:id,name,grade', 'answers.selectedOption', 'answers.question']);

        $quiz->load('questions.options');

        return Inertia::render('Teacher/Quizzes/Recheck', [
            'quiz' => $quiz,
            'attempt' => $attempt,
        ]);
    }

    public function recheckUpdate(Request $request, Quiz $quiz, QuizAttempt $attempt): RedirectResponse
    {
        $this->authorizeOwner($quiz);

        $data = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*.id' => ['required', 'exists:quiz_answers,id'],
            'answers.*.is_correct' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($data, $attempt) {
            foreach ($data['answers'] as $answerData) {
                QuizAnswer::where('id', $answerData['id'])
                    ->where('quiz_attempt_id', $attempt->id)
                    ->update(['is_correct' => $answerData['is_correct']]);
            }

            $score = QuizAnswer::where('quiz_attempt_id', $attempt->id)
                ->where('is_correct', true)
                ->join('questions', 'quiz_answers.question_id', '=', 'questions.id')
                ->sum('questions.points');

            $attempt->update(['score' => $score]);
        });

        return redirect()->route('teacher.quizzes.show', $quiz)->with('success', 'Quiz rechecked successfully.');
    }

    public function publish(Quiz $quiz): RedirectResponse
    {
        $this->authorizeOwner($quiz);

        if ($quiz->is_published) {
            $quiz->update(['is_published' => false, 'closes_at' => null]);
            $msg = 'Quiz unpublished.';
        } else {
            $quiz->update(['is_published' => true, 'closes_at' => now()->addDay()]);
            $msg = 'Quiz published. It will close in 24 hours.';
        }

        return back()->with('success', $msg);
    }

    public function reopen(Quiz $quiz): RedirectResponse
    {
        $this->authorizeOwner($quiz);
        $quiz->update(['closes_at' => now()->addDay()]);
        return back()->with('success', 'Quiz reopened. It will close in 24 hours.');
    }

    public function destroy(Quiz $quiz): RedirectResponse
    {
        $this->authorizeOwner($quiz);

        $quiz->delete();

        return redirect()->route('teacher.dashboard')->with('success', 'Quiz deleted.');
    }

    public function reassign(Request $request, Quiz $quiz): RedirectResponse
    {
        abort_unless(Auth::user()->isSuperadmin(), 403);

        $data = $request->validate(['teacher_id' => ['required', 'exists:users,id']]);
        $quiz->update(['teacher_id' => $data['teacher_id']]);

        return back()->with('success', 'Quiz reassigned to teacher.');
    }

    private function authorizeOwner(Quiz $quiz): void
    {
        if (Auth::user()->isSuperadmin()) {
            return;
        }

        if ($quiz->teacher_id !== Auth::id()) {
            abort(403, 'You do not have access to this quiz.');
        }
    }
}
