<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamSection;
use App\Models\GradeLevel;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    // ─── Teacher ───────────────────────────────────────────────────

    public function index(): Response
    {
        $teacher = Auth::user();

        $exams = $teacher->isSuperadmin()
            ? Exam::withCount('sections')->withCount('attempts')->with('teacher:id,name', 'gradeLevels:id,name')->latest()->get()
            : $teacher->exams()->withCount('sections')->withCount('attempts')->with('gradeLevels:id,name')->latest()->get();

        return Inertia::render('Teacher/Exams/Index', [
            'exams' => $exams,
            'isSuperadmin' => $teacher->isSuperadmin(),
            'teachers' => $teacher->isSuperadmin() ? User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']) : [],
            'gradeLevels' => GradeLevel::where('is_active', true)->orderBy('display_order')->orderBy('name')->get(['id', 'name']),
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
            'max_score' => ['nullable', 'integer', 'min:1'],
            'teacher_id' => ['nullable', 'exists:users,id'],
            'sections' => ['required', 'array', 'min:1'],
            'sections.*.title' => ['required', 'string', 'max:255'],
            'sections.*.section_type' => ['required', 'in:questions,practical'],
            'sections.*.instructions' => ['nullable', 'string'],
            'sections.*.questions' => ['nullable', 'array'],
            'sections.*.questions.*.question_text' => ['required_with:sections.*.questions', 'string'],
            'sections.*.questions.*.type' => ['required_with:sections.*.questions', 'in:multiple_choice,true_false,identification,enumeration,matching'],
            'sections.*.questions.*.points' => ['nullable', 'integer', 'min:1'],
            'sections.*.questions.*.options' => ['nullable', 'array'],
            'sections.*.questions.*.options.*.option_text' => ['required_with:sections.*.questions.*.options', 'string'],
            'sections.*.questions.*.options.*.is_correct' => ['boolean'],
            'sections.*.questions.*.matching_pairs' => ['nullable', 'array'],
            'sections.*.questions.*.matching_pairs.*.left_text' => ['required_with:sections.*.questions.*.matching_pairs', 'string'],
            'sections.*.questions.*.matching_pairs.*.right_text' => ['required_with:sections.*.questions.*.matching_pairs', 'string'],
            'sections.*.criteria' => ['nullable', 'array'],
            'sections.*.criteria.*.criterion_name' => ['required_with:sections.*.criteria', 'string', 'max:255'],
            'sections.*.criteria.*.description' => ['nullable', 'string'],
            'sections.*.criteria.*.max_points' => ['required_with:sections.*.criteria', 'integer', 'min:1'],
        ]);

        DB::transaction(function () use ($data) {
            $teacherId = Auth::user()->isSuperadmin() && $data['teacher_id'] ? $data['teacher_id'] : Auth::id();

            $grade = GradeLevel::whereIn('id', $data['grade_level_ids'])
                ->orderBy('display_order')
                ->value('name');

            $exam = Exam::create([
                'teacher_id' => $teacherId,
                'title' => $data['title'],
                'grade' => $grade,
                'instructions' => $data['instructions'] ?? null,
                'time_limit_minutes' => $data['time_limit_minutes'] ?? null,
                'max_score' => $data['max_score'] ?? 100,
                'is_published' => false,
            ]);

            $exam->gradeLevels()->sync($data['grade_level_ids']);

            foreach ($data['sections'] as $sIndex => $sec) {
                $section = $exam->sections()->create([
                    'section_type' => $sec['section_type'],
                    'title' => $sec['title'],
                    'instructions' => $sec['instructions'] ?? null,
                    'order' => $sIndex,
                ]);

                if ($sec['section_type'] === 'questions' && isset($sec['questions'])) {
                    foreach ($sec['questions'] as $qIndex => $q) {
                        $question = $section->questions()->create([
                            'question_text' => $q['question_text'],
                            'type' => $q['type'],
                            'points' => $q['points'] ?? 1,
                            'order' => $qIndex,
                        ]);

                        if (in_array($q['type'], ['multiple_choice', 'true_false']) && isset($q['options'])) {
                            foreach ($q['options'] as $oIndex => $opt) {
                                $question->options()->create([
                                    'option_text' => $opt['option_text'],
                                    'is_correct' => $opt['is_correct'] ?? false,
                                    'order' => $oIndex,
                                ]);
                            }
                        }

                        if ($q['type'] === 'matching' && isset($q['matching_pairs'])) {
                            foreach ($q['matching_pairs'] as $mIndex => $pair) {
                                $question->matchingPairs()->create([
                                    'left_text' => $pair['left_text'],
                                    'right_text' => $pair['right_text'],
                                    'order' => $mIndex,
                                ]);
                            }
                        }
                    }
                }

                if ($sec['section_type'] === 'practical' && isset($sec['criteria'])) {
                    foreach ($sec['criteria'] as $cIndex => $criterion) {
                        $section->criteria()->create([
                            'criterion_name' => $criterion['criterion_name'],
                            'description' => $criterion['description'] ?? null,
                            'max_points' => $criterion['max_points'],
                            'order' => $cIndex,
                        ]);
                    }
                }
            }

            $totalMax = 0;
            $exam->load('sections.questions', 'sections.criteria');
            foreach ($exam->sections as $sec) {
                if ($sec->section_type === 'questions') {
                    foreach ($sec->questions as $q) {
                        $totalMax += $q->points;
                    }
                } else {
                    foreach ($sec->criteria as $c) {
                        $totalMax += $c->max_points;
                    }
                }
            }
            $exam->update(['max_score' => $totalMax]);
        });

        return redirect()->route('teacher.exams.index')->with('success', 'Exam created successfully.');
    }

    public function show(Exam $exam): Response
    {
        $this->authorizeOwner($exam);
        $exam->load(['sections.questions.options', 'sections.questions.matchingPairs', 'sections.criteria', 'gradeLevels:id,name']);

        $teacher = Auth::user();

        $attempts = $exam->attempts()
            ->with('student:id,name,grade')
            ->where('status', 'submitted')
            ->orderByDesc('total_score')
            ->get();

        return Inertia::render('Teacher/Exams/Show', [
            'exam' => $exam,
            'attempts' => $attempts,
            'teachers' => $teacher->isSuperadmin() ? User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function publish(Exam $exam): RedirectResponse
    {
        $this->authorizeOwner($exam);
        $exam->update(['is_published' => !$exam->is_published]);
        return back()->with('success', $exam->is_published ? 'Exam published.' : 'Exam unpublished.');
    }

    public function destroy(Exam $exam): RedirectResponse
    {
        $this->authorizeOwner($exam);
        $exam->delete();
        return redirect()->route('teacher.exams.index')->with('success', 'Exam deleted.');
    }

    // ─── Student ───────────────────────────────────────────────────

    public function take(Exam $exam): Response|RedirectResponse
    {
        abort_unless($exam->is_published, 403);

        $student = Auth::user();
        $existing = ExamAttempt::where('exam_id', $exam->id)->where('student_id', $student->id)->first();

        if ($existing && $existing->status === 'submitted') {
            return redirect()->route('student.exams.result', ['attempt' => $existing->id])
                ->with('info', 'Already submitted.');
        }

        if (!$existing) {
            $existing = ExamAttempt::create([
                'exam_id' => $exam->id,
                'student_id' => $student->id,
                'status' => 'in_progress',
                'started_at' => now(),
            ]);
        }

        $exam->load(['sections' => function ($q) {
            $q->orderBy('order');
        }, 'sections.questions' => function ($q) {
            $q->orderBy('order');
        }, 'sections.questions.options' => function ($q) {
            $q->orderBy('order');
        }, 'sections.questions.matchingPairs' => function ($q) {
            $q->orderBy('order');
        }, 'sections.criteria' => function ($q) {
            $q->orderBy('order');
        }]);

        foreach ($exam->sections as $sec) {
            if ($sec->section_type === 'questions') {
                $shuffled = $sec->questions->shuffle();
                foreach ($shuffled as $q) {
                    if (in_array($q->type, ['multiple_choice', 'true_false'])) {
                        $q->setRelation('options', $q->options->shuffle());
                    }
                    if ($q->type === 'matching') {
                        $q->setRelation('matchingPairs', $q->matchingPairs->shuffle());
                    }
                    $q->makeHidden(['options' => fn ($o) => $o->makeHidden('is_correct')]);
                }
                $sec->setRelation('questions', $shuffled);
            }
        }

        return Inertia::render('Student/Exam/Take', [
            'exam' => $exam,
            'startedAt' => $existing->started_at,
        ]);
    }

    public function submit(Request $request, Exam $exam): RedirectResponse
    {
        abort_unless($exam->is_published, 403);

        $student = Auth::user();
        $attempt = ExamAttempt::where('exam_id', $exam->id)->where('student_id', $student->id)->firstOrFail();

        if ($attempt->status === 'submitted') {
            return redirect()->route('student.exams.result', ['attempt' => $attempt->id])
                ->with('info', 'Already submitted.');
        }

        $exam->load('sections.questions.options', 'sections.questions.matchingPairs', 'sections.criteria');

        $totalScore = 0;

        DB::transaction(function () use ($request, $exam, $attempt, &$totalScore) {
            foreach ($exam->sections as $section) {
                if ($section->section_type === 'questions') {
                    foreach ($section->questions as $question) {
                        $answerData = $this->gradeQuestion($question, $request->input('answers.' . $question->id));

                        if ($answerData['is_correct']) {
                            $answerData['points_earned'] = $question->points;
                            $totalScore += $question->points;
                        } else {
                            $answerData['points_earned'] = 0;
                        }

                        $attempt->answers()->updateOrCreate(
                            ['exam_question_id' => $question->id],
                            $answerData
                        );
                    }
                }

                if ($section->section_type === 'practical') {
                    foreach ($section->criteria as $criterion) {
                        $attempt->sectionScores()->updateOrCreate(
                            ['exam_criterion_id' => $criterion->id],
                            [
                                'exam_section_id' => $section->id,
                                'score' => 0,
                                'comment' => null,
                            ]
                        );
                    }
                }
            }

            $attempt->update([
                'total_score' => $totalScore,
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);
        });

        return redirect()->route('student.exams.result', ['attempt' => $attempt->id])
            ->with('success', 'Exam submitted.');
    }

    public function result(ExamAttempt $attempt): Response
    {
        $student = Auth::user();
        abort_if($attempt->student_id !== $student->id, 403);

        $attempt->load([
            'exam.sections.questions' => fn ($q) => $q->orderBy('order'),
            'exam.sections.questions.options' => fn ($q) => $q->orderBy('order'),
            'exam.sections.questions.matchingPairs' => fn ($q) => $q->orderBy('order'),
            'exam.sections.criteria' => fn ($q) => $q->orderBy('order'),
            'answers' => fn ($q) => $q->with('question', 'selectedOption'),
            'sectionScores' => fn ($q) => $q->with('criterion'),
        ]);

        return Inertia::render('Student/Exam/Result', ['attempt' => $attempt]);
    }

    public function grade(Request $request, ExamAttempt $attempt): RedirectResponse
    {
        $exam = $attempt->exam;
        $this->authorizeOwner($exam);

        $request->validate([
            'scores' => ['required', 'array'],
            'scores.*' => ['integer', 'min:0'],
            'comments' => ['nullable', 'array'],
            'comments.*' => ['nullable', 'string'],
        ]);

        $exam->load('sections.criteria');
        $totalPractical = 0;

        DB::transaction(function () use ($request, $exam, $attempt, &$totalPractical) {
            foreach ($exam->sections as $section) {
                if ($section->section_type !== 'practical') continue;

                foreach ($section->criteria as $criterion) {
                    $score = min((int) ($request->input('scores.' . $criterion->id) ?? 0), $criterion->max_points);
                    $totalPractical += $score;

                    $attempt->sectionScores()->updateOrCreate(
                        ['exam_criterion_id' => $criterion->id],
                        [
                            'exam_section_id' => $section->id,
                            'score' => $score,
                            'comment' => $request->input('comments.' . $criterion->id, ''),
                        ]
                    );
                }
            }

            $autoScore = $attempt->answers()->where('is_correct', true)->sum('points_earned');
            $attempt->update(['total_score' => $autoScore + $totalPractical]);
        });

        return back()->with('success', 'Practical scores updated.');
    }

    public function attempts(Exam $exam): Response
    {
        $this->authorizeOwner($exam);
        $exam->load('sections.criteria');

        $attempts = $exam->attempts()
            ->with('student:id,name,grade', 'sectionScores.criterion', 'answers.question')
            ->where('status', 'submitted')
            ->orderByDesc('total_score')
            ->get();

        return Inertia::render('Teacher/Exams/Grade', [
            'exam' => $exam,
            'attempts' => $attempts,
        ]);
    }

    public function reassign(Request $request, Exam $exam): RedirectResponse
    {
        abort_unless(Auth::user()->isSuperadmin(), 403);

        $data = $request->validate(['teacher_id' => ['required', 'exists:users,id']]);
        $exam->update(['teacher_id' => $data['teacher_id']]);

        return back()->with('success', 'Exam reassigned to teacher.');
    }

    // ─── Internal helpers ──────────────────────────────────────────

    private function authorizeOwner(Exam $exam): void
    {
        if (Auth::user()->isSuperadmin()) return;
        abort_if($exam->teacher_id !== Auth::id(), 403);
    }

    private function gradeQuestion($question, $answer): array
    {
        $data = ['exam_question_id' => $question->id, 'is_correct' => false];

        return match ($question->type) {
            'identification' => [
                'answer_text' => $answer ?? '',
                'is_correct' => $this->gradeIdentification($question, $answer),
            ],
            'enumeration' => [
                'answer_text' => $answer ?? '',
                'is_correct' => false,
            ],
            'true_false', 'multiple_choice' => [
                'selected_option_id' => $answer,
                'is_correct' => $this->gradeOption($question, $answer),
            ],
            'matching' => [
                'matching_answers' => $answer,
                'is_correct' => $this->gradeMatching($question, $answer),
            ],
            default => ['answer_text' => $answer ?? '', 'is_correct' => false],
        };
    }

    private function gradeIdentification($question, $answer): bool
    {
        $correct = trim(mb_strtolower($question->question_text));
        $student = trim(mb_strtolower($answer ?? ''));
        return $student === $correct;
    }

    private function gradeOption($question, $optionId): bool
    {
        if (!$optionId) return false;
        $option = $question->options->firstWhere('id', $optionId);
        return $option && $option->is_correct;
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
