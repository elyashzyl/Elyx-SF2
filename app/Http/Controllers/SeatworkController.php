<?php

namespace App\Http\Controllers;

use App\Models\Seatwork;
use App\Models\SeatworkAnswer;
use App\Models\SeatworkAttempt;
use App\Models\GradeLevel;
use App\Models\Section;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SeatworkController extends Controller
{
    // ---- Teacher methods ----

    public function index(): Response
    {
        $teacher = Auth::user();

        $seatworks = $teacher->isSuperadmin()
            ? Seatwork::withCount('questions')->withCount('attempts')->with('teacher:id,name', 'gradeLevels:id,name')->latest()->get()
            : $teacher->seatworks()->withCount('questions')->withCount('attempts')->with('gradeLevels:id,name')->latest()->get();

        $gradeLevels = GradeLevel::where('is_active', true)->orderBy('display_order')->orderBy('name')->get(['id', 'name']);
        $allSections = Section::where('is_active', true)->orderBy('name')->get(['id', 'name', 'grade_level_id']);

        return Inertia::render('Teacher/Seatworks/Index', [
            'seatworks' => $seatworks,
            'gradeLevels' => $gradeLevels,
            'allSections' => $allSections,
            'isSuperadmin' => $teacher->isSuperadmin(),
            'teachers' => $teacher->isSuperadmin() ? User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'grade_level_ids' => ['required', 'array', 'min:1'],
            'grade_level_ids.*' => ['exists:grade_levels,id'],
            'instructions' => ['nullable', 'string'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1'],
            'teacher_id' => ['nullable', 'exists:users,id'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.question_text' => ['required', 'string'],
            'questions.*.type' => ['required', 'in:identification,enumeration,true_false,multiple_choice,matching'],
            'questions.*.points' => ['required', 'integer', 'min:1'],
            'questions.*.correct_answer' => ['nullable', 'string'],
            'questions.*.enum_items' => ['nullable', 'array'],
            'questions.*.enum_items.*' => ['string'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.options.*.option_text' => ['required_with:questions.*.options', 'string'],
            'questions.*.options.*.is_correct' => ['boolean'],
            'questions.*.matching_pairs' => ['nullable', 'array'],
            'questions.*.matching_pairs.*.left_text' => ['required_with:questions.*.matching_pairs', 'string'],
            'questions.*.matching_pairs.*.right_text' => ['required_with:questions.*.matching_pairs', 'string'],
        ]);

        DB::transaction(function () use ($data) {
            $teacherId = Auth::user()->isSuperadmin() && $data['teacher_id'] ? $data['teacher_id'] : Auth::id();

            $grade = GradeLevel::whereIn('id', $data['grade_level_ids'])
                ->orderBy('display_order')
                ->value('name');

            $seatwork = Seatwork::create([
                'teacher_id' => $teacherId,
                'title' => $data['title'],
                'grade' => $grade,
                'instructions' => $data['instructions'] ?? null,
                'time_limit_minutes' => $data['time_limit_minutes'] ?? null,
                'is_published' => false,
            ]);

            $seatwork->gradeLevels()->sync($data['grade_level_ids']);

            foreach ($data['questions'] as $qIndex => $question) {
                $created = $seatwork->questions()->create([
                    'question_text' => $question['question_text'],
                    'type' => $question['type'],
                    'points' => $question['points'],
                    'order' => $qIndex,
                ]);

                if ($question['type'] === 'identification') {
                    $created->options()->create([
                        'option_text' => $question['correct_answer'] ?? '',
                        'is_correct' => true,
                        'order' => 0,
                    ]);
                }

                if ($question['type'] === 'enumeration') {
                    foreach ($question['enum_items'] ?? [] as $eIndex => $item) {
                        if (trim($item ?? '') === '') continue;
                        $created->options()->create([
                            'option_text' => $item,
                            'is_correct' => true,
                            'order' => $eIndex,
                        ]);
                    }
                }

                if (in_array($question['type'], ['true_false', 'multiple_choice'])) {
                    foreach ($question['options'] ?? [] as $oIndex => $option) {
                        $created->options()->create([
                            'option_text' => $option['option_text'],
                            'is_correct' => (bool) ($option['is_correct'] ?? false),
                            'order' => $oIndex,
                        ]);
                    }
                }

                if ($question['type'] === 'matching') {
                    foreach ($question['matching_pairs'] ?? [] as $mIndex => $pair) {
                        $created->matchingPairs()->create([
                            'left_text' => $pair['left_text'],
                            'right_text' => $pair['right_text'],
                            'order' => $mIndex,
                        ]);
                    }
                }
            }
        });

        return redirect()->route('teacher.seatworks.index')->with('success', 'Seatwork created successfully.');
    }

    public function edit(Seatwork $seatwork): Response
    {
        $this->authorizeOwner($seatwork);
        $seatwork->load(['questions.options', 'questions.matchingPairs', 'gradeLevels:id,name']);

        $teacher = Auth::user();
        $gradeLevels = GradeLevel::where('is_active', true)->orderBy('display_order')->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Teacher/Seatworks/Edit', [
            'seatwork' => $seatwork,
            'teachers' => $teacher->isSuperadmin() ? User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']) : [],
            'gradeLevels' => $gradeLevels,
        ]);
    }

    public function update(Request $request, Seatwork $seatwork): RedirectResponse
    {
        $this->authorizeOwner($seatwork);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'grade_level_ids' => ['required', 'array', 'min:1'],
            'grade_level_ids.*' => ['exists:grade_levels,id'],
            'instructions' => ['nullable', 'string'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1'],
            'teacher_id' => ['nullable', 'exists:users,id'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.question_text' => ['required', 'string'],
            'questions.*.type' => ['required', 'in:identification,enumeration,true_false,multiple_choice,matching'],
            'questions.*.points' => ['required', 'integer', 'min:1'],
            'questions.*.correct_answer' => ['nullable', 'string'],
            'questions.*.enum_items' => ['nullable', 'array'],
            'questions.*.enum_items.*' => ['string'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.options.*.option_text' => ['required_with:questions.*.options', 'string'],
            'questions.*.options.*.is_correct' => ['boolean'],
            'questions.*.matching_pairs' => ['nullable', 'array'],
            'questions.*.matching_pairs.*.left_text' => ['required_with:questions.*.matching_pairs', 'string'],
            'questions.*.matching_pairs.*.right_text' => ['required_with:questions.*.matching_pairs', 'string'],
        ]);

        DB::transaction(function () use ($data, $seatwork) {
            $updateData = [
                'title' => $data['title'],
                'instructions' => $data['instructions'] ?? null,
                'time_limit_minutes' => $data['time_limit_minutes'] ?? null,
            ];

            if (Auth::user()->isSuperadmin() && $data['teacher_id']) {
                $updateData['teacher_id'] = $data['teacher_id'];
            }

            $grade = GradeLevel::whereIn('id', $data['grade_level_ids'])
                ->orderBy('display_order')
                ->value('name');
            $seatwork->grade = $grade;

            $seatwork->update($updateData);
            $seatwork->gradeLevels()->sync($data['grade_level_ids']);

            $seatwork->questions()->delete();

            foreach ($data['questions'] as $qIndex => $question) {
                $created = $seatwork->questions()->create([
                    'question_text' => $question['question_text'],
                    'type' => $question['type'],
                    'points' => $question['points'],
                    'order' => $qIndex,
                ]);

                if ($question['type'] === 'identification') {
                    $created->options()->create([
                        'option_text' => $question['correct_answer'] ?? '',
                        'is_correct' => true,
                        'order' => 0,
                    ]);
                }

                if ($question['type'] === 'enumeration') {
                    foreach ($question['enum_items'] ?? [] as $eIndex => $item) {
                        if (trim($item ?? '') === '') continue;
                        $created->options()->create([
                            'option_text' => $item,
                            'is_correct' => true,
                            'order' => $eIndex,
                        ]);
                    }
                }

                if (in_array($question['type'], ['true_false', 'multiple_choice'])) {
                    foreach ($question['options'] ?? [] as $oIndex => $option) {
                        $created->options()->create([
                            'option_text' => $option['option_text'],
                            'is_correct' => (bool) ($option['is_correct'] ?? false),
                            'order' => $oIndex,
                        ]);
                    }
                }

                if ($question['type'] === 'matching') {
                    foreach ($question['matching_pairs'] ?? [] as $mIndex => $pair) {
                        $created->matchingPairs()->create([
                            'left_text' => $pair['left_text'],
                            'right_text' => $pair['right_text'],
                            'order' => $mIndex,
                        ]);
                    }
                }
            }
        });

        return redirect()->route('teacher.seatworks.show', $seatwork)->with('success', 'Seatwork updated successfully.');
    }

    public function show(Seatwork $seatwork): Response
    {
        $this->authorizeOwner($seatwork);
        $seatwork->load(['questions.options', 'questions.matchingPairs', 'gradeLevels:id,name']);
        $teacher = Auth::user();
        $attempts = $seatwork->attempts()->with('student:id,name,grade')->where('status', 'submitted')->orderByDesc('score')->get();

        return Inertia::render('Teacher/Seatworks/Show', [
            'seatwork' => $seatwork,
            'attempts' => $attempts,
            'totalPoints' => $seatwork->totalPoints(),
            'teachers' => $teacher->isSuperadmin() ? User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function publish(Seatwork $seatwork): RedirectResponse
    {
        $this->authorizeOwner($seatwork);
        if ($seatwork->is_published) {
            $seatwork->update(['is_published' => false, 'closes_at' => null]);
            $msg = 'Seatwork unpublished.';
        } else {
            $seatwork->update(['is_published' => true, 'closes_at' => now()->addDay()]);
            $msg = 'Seatwork published. It will close in 24 hours.';
        }
        return back()->with('success', $msg);
    }

    public function reopen(Seatwork $seatwork): RedirectResponse
    {
        $this->authorizeOwner($seatwork);
        $seatwork->update(['closes_at' => now()->addDay()]);
        return back()->with('success', 'Seatwork reopened. It will close in 24 hours.');
    }

    public function destroy(Seatwork $seatwork): RedirectResponse
    {
        $this->authorizeOwner($seatwork);
        $seatwork->delete();
        return redirect()->route('teacher.seatworks.index')->with('success', 'Seatwork deleted.');
    }

    // ---- Student methods ----

    public function take(Seatwork $seatwork): Response|RedirectResponse
    {
        $student = Auth::user();
        abort_unless($seatwork->is_published, 403);
        abort_if($seatwork->isClosed(), 403, 'This seatwork has closed.');

        $existing = SeatworkAttempt::where('seatwork_id', $seatwork->id)->where('student_id', $student->id)->first();
        if ($existing && $existing->status === 'submitted') {
            return redirect()->route('student.dashboard')->with('info', 'You have already submitted this seatwork.');
        }

        if (!$existing) {
            $existing = SeatworkAttempt::create([
                'seatwork_id' => $seatwork->id, 'student_id' => $student->id,
                'status' => 'in_progress', 'started_at' => now(),
                'total_points' => $seatwork->totalPoints(),
            ]);
        }

        $seatwork->load(['questions' => fn($q) => $q->inRandomOrder(), 'questions.options' => fn($o) => $o->inRandomOrder(), 'questions.matchingPairs']);

        return Inertia::render('Student/Seatwork/Take', ['seatwork' => $seatwork, 'startedAt' => $existing->started_at]);
    }

    public function submit(Request $request, Seatwork $seatwork): RedirectResponse
    {
        $student = Auth::user();
        abort_unless($seatwork->is_published, 403);
        abort_if($seatwork->isClosed(), 403, 'This seatwork has closed.');

        $attempt = SeatworkAttempt::where('seatwork_id', $seatwork->id)->where('student_id', $student->id)->firstOrFail();
        if ($attempt->status === 'submitted') {
            return redirect()->route('student.dashboard')->with('info', 'Already submitted.');
        }

        $seatwork->load('questions.options', 'questions.matchingPairs');
        $score = 0;

        DB::transaction(function () use ($request, $seatwork, $attempt, &$score) {
            foreach ($seatwork->questions as $question) {
                $answerData = $this->gradeQuestion($question, $request->input('answers.' . $question->id));
                if ($answerData['is_correct']) $score += $question->points;

                $attempt->answers()->updateOrCreate(
                    ['question_id' => $question->id],
                    $answerData
                );
            }
            $attempt->update(['score' => $score, 'total_points' => $seatwork->totalPoints(), 'status' => 'submitted', 'submitted_at' => now()]);
        });

        return redirect()->route('student.seatworks.result', ['attempt' => $attempt->id])->with('success', 'Seatwork submitted.');
    }

    public function result(SeatworkAttempt $attempt): Response
    {
        $student = Auth::user();
        abort_if($attempt->student_id !== $student->id, 403);
        $attempt->load(['seatwork.questions.options', 'seatwork.questions.matchingPairs', 'answers.selectedOption']);

        return Inertia::render('Student/Seatwork/Result', ['attempt' => $attempt]);
    }

    // ---- Helpers ----

    public function reassign(Request $request, Seatwork $seatwork): RedirectResponse
    {
        abort_unless(Auth::user()->isSuperadmin(), 403);

        $data = $request->validate(['teacher_id' => ['required', 'exists:users,id']]);
        $seatwork->update(['teacher_id' => $data['teacher_id']]);

        return back()->with('success', 'Seatwork reassigned to teacher.');
    }

    public function autoRecheck(Seatwork $seatwork, SeatworkAttempt $attempt): RedirectResponse
    {
        $this->authorizeOwner($seatwork);

        $seatwork->load('questions.options', 'questions.matchingPairs');
        $attempt->load('answers');

        DB::transaction(function () use ($seatwork, $attempt) {
            $score = 0;

            foreach ($attempt->answers as $answer) {
                $question = $seatwork->questions->firstWhere('id', $answer->question_id);
                if (! $question) continue;

                $isCorrect = match ($question->type) {
                    'identification' => strtolower(trim($answer->answer_text ?? '')) === strtolower(trim($question->options->first()?->option_text ?? '')),
                    'enumeration' => false,
                    'true_false', 'multiple_choice' => (bool) ($question->options->firstWhere('id', $answer->selected_option_id)?->is_correct ?? false),
                    'matching' => $this->gradeMatching($question, $answer->matching_answers),
                    default => false,
                };

                $answer->update(['is_correct' => $isCorrect]);

                if ($isCorrect) {
                    $score += $question->points;
                }
            }

            $attempt->update(['score' => $score]);
        });

        return back()->with('success', 'Seatwork auto-rechecked successfully.');
    }

    public function recheck(Seatwork $seatwork, SeatworkAttempt $attempt): Response
    {
        $this->authorizeOwner($seatwork);

        $attempt->load(['student:id,name,grade', 'answers.question', 'answers.selectedOption']);
        $seatwork->load('questions.options', 'questions.matchingPairs');

        return Inertia::render('Teacher/Seatworks/Recheck', [
            'seatwork' => $seatwork,
            'attempt' => $attempt,
        ]);
    }

    public function recheckUpdate(Request $request, Seatwork $seatwork, SeatworkAttempt $attempt): RedirectResponse
    {
        $this->authorizeOwner($seatwork);

        $data = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*.id' => ['required', 'exists:seatwork_answers,id'],
            'answers.*.is_correct' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($data, $attempt) {
            foreach ($data['answers'] as $answerData) {
                SeatworkAnswer::where('id', $answerData['id'])
                    ->where('attempt_id', $attempt->id)
                    ->update(['is_correct' => $answerData['is_correct']]);
            }

            $score = SeatworkAnswer::where('attempt_id', $attempt->id)
                ->where('is_correct', true)
                ->join('seatwork_questions', 'seatwork_answers.question_id', '=', 'seatwork_questions.id')
                ->sum('seatwork_questions.points');

            $attempt->update(['score' => $score]);
        });

        return redirect()->route('teacher.seatworks.show', $seatwork)->with('success', 'Seatwork rechecked successfully.');
    }

    private function authorizeOwner(Seatwork $seatwork): void
    {
        if (Auth::user()->isSuperadmin()) return;
        abort_if($seatwork->teacher_id !== Auth::id(), 403);
    }

    private function gradeQuestion($question, $answer): array
    {
        $data = ['question_id' => $question->id, 'is_correct' => false];

        return match ($question->type) {
            'identification' => [
                'answer_text' => $answer,
                'is_correct' => strtolower(trim($answer ?? '')) === strtolower(trim($question->options->first()?->option_text ?? '')),
            ],
            'enumeration' => [
                'answer_text' => is_array($answer) ? implode("\n", $answer) : $answer,
                'is_correct' => false,
            ],
            'true_false', 'multiple_choice' => [
                'selected_option_id' => $answer,
                'is_correct' => $question->options->firstWhere('id', $answer)?->is_correct ?? false,
            ],
            'matching' => [
                'matching_answers' => $answer,
                'is_correct' => $this->gradeMatching($question, $answer),
            ],
            default => ['answer_text' => $answer ?? '', 'is_correct' => false],
        };
    }

    private function gradeMatching($question, $answers): bool
    {
        if (!is_array($answers)) return false;
        $pairs = $question->matchingPairs;
        foreach ($pairs as $pair) {
            $studentRight = $answers[$pair->id] ?? null;
            if ($studentRight !== $pair->right_text) return false;
        }
        return true;
    }
}
