<?php

namespace App\Http\Controllers;

use App\Models\Practical;
use App\Models\PracticalAttempt;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PracticalController extends Controller
{
    public function index(): Response
    {
        $teacher = Auth::user();

        $practicals = $teacher->isSuperadmin()
            ? Practical::withCount('criteria')->withCount('attempts')->with('teacher:id,name')->latest()->get()
            : $teacher->practicals()->withCount('criteria')->withCount('attempts')->latest()->get();

        return Inertia::render('Teacher/Practicals/Index', [
            'practicals' => $practicals,
            'isSuperadmin' => $teacher->isSuperadmin(),
            'teachers' => $teacher->isSuperadmin() ? User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'instructions' => ['nullable', 'string'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1'],
            'max_score' => ['nullable', 'integer', 'min:1'],
            'teacher_id' => ['nullable', 'exists:users,id'],
            'criteria' => ['required', 'array', 'min:1'],
            'criteria.*.criterion_name' => ['required', 'string', 'max:255'],
            'criteria.*.description' => ['nullable', 'string'],
            'criteria.*.max_points' => ['required', 'integer', 'min:1'],
        ]);

        DB::transaction(function () use ($data) {
            $teacherId = Auth::user()->isSuperadmin() && $data['teacher_id'] ? $data['teacher_id'] : Auth::id();

            $practical = Practical::create([
                'teacher_id' => $teacherId,
                'title' => $data['title'],
                'instructions' => $data['instructions'] ?? null,
                'time_limit_minutes' => $data['time_limit_minutes'] ?? null,
                'max_score' => $data['max_score'] ?? 100,
                'is_published' => false,
            ]);

            foreach ($data['criteria'] as $cIndex => $criterion) {
                $practical->criteria()->create([
                    'criterion_name' => $criterion['criterion_name'],
                    'description' => $criterion['description'] ?? null,
                    'max_points' => $criterion['max_points'],
                    'order' => $cIndex,
                ]);
            }
        });

        return redirect()->route('teacher.practicals.index')->with('success', 'Practical created successfully.');
    }

    public function edit(Practical $practical): Response
    {
        $this->authorizeOwner($practical);
        $practical->load('criteria');

        $teacher = Auth::user();

        return Inertia::render('Teacher/Practicals/Edit', [
            'practical' => $practical,
            'teachers' => $teacher->isSuperadmin() ? User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function update(Request $request, Practical $practical): RedirectResponse
    {
        $this->authorizeOwner($practical);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'instructions' => ['nullable', 'string'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1'],
            'max_score' => ['nullable', 'integer', 'min:1'],
            'teacher_id' => ['nullable', 'exists:users,id'],
            'criteria' => ['required', 'array', 'min:1'],
            'criteria.*.criterion_name' => ['required', 'string', 'max:255'],
            'criteria.*.description' => ['nullable', 'string'],
            'criteria.*.max_points' => ['required', 'integer', 'min:1'],
        ]);

        DB::transaction(function () use ($data, $practical) {
            $updateData = [
                'title' => $data['title'],
                'instructions' => $data['instructions'] ?? null,
                'time_limit_minutes' => $data['time_limit_minutes'] ?? null,
                'max_score' => $data['max_score'] ?? 100,
            ];

            if (Auth::user()->isSuperadmin() && $data['teacher_id']) {
                $updateData['teacher_id'] = $data['teacher_id'];
            }

            $practical->update($updateData);

            $practical->criteria()->delete();

            foreach ($data['criteria'] as $cIndex => $criterion) {
                $practical->criteria()->create([
                    'criterion_name' => $criterion['criterion_name'],
                    'description' => $criterion['description'] ?? null,
                    'max_points' => $criterion['max_points'],
                    'order' => $cIndex,
                ]);
            }
        });

        return redirect()->route('teacher.practicals.show', $practical)->with('success', 'Practical updated successfully.');
    }

    public function show(Practical $practical): Response
    {
        $this->authorizeOwner($practical);
        $practical->load('criteria');

        $teacher = Auth::user();

        $attempts = $practical->attempts()
            ->with('student:id,name,grade', 'scores.criterion:id,criterion_name,max_points')
            ->orderBy('status')
            ->orderByDesc('total_score')
            ->get();

        return Inertia::render('Teacher/Practicals/Show', [
            'practical' => $practical,
            'attempts' => $attempts,
            'teachers' => $teacher->isSuperadmin() ? User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function publish(Practical $practical): RedirectResponse
    {
        $this->authorizeOwner($practical);
        $practical->update(['is_published' => !$practical->is_published]);
        return back()->with('success', $practical->is_published ? 'Practical published.' : 'Practical unpublished.');
    }

    public function destroy(Practical $practical): RedirectResponse
    {
        $this->authorizeOwner($practical);
        $practical->delete();
        return redirect()->route('teacher.practicals.index')->with('success', 'Practical deleted.');
    }

    public function take(Practical $practical): Response|RedirectResponse
    {
        $student = Auth::user();
        abort_unless($practical->is_published, 403);

        $existing = PracticalAttempt::where('practical_id', $practical->id)->where('student_id', $student->id)->first();
        if ($existing && $existing->status === 'submitted') {
            return redirect()->route('student.dashboard')->with('info', 'Already submitted.');
        }

        if (!$existing) {
            $existing = PracticalAttempt::create([
                'practical_id' => $practical->id, 'student_id' => $student->id,
                'status' => 'in_progress', 'started_at' => now(),
            ]);
        }

        $practical->load('criteria');

        return Inertia::render('Student/Practical/Take', [
            'practical' => $practical,
            'startedAt' => $existing->started_at,
        ]);
    }

    public function submit(Request $request, Practical $practical): RedirectResponse
    {
        $student = Auth::user();
        abort_unless($practical->is_published, 403);

        $attempt = PracticalAttempt::where('practical_id', $practical->id)->where('student_id', $student->id)->firstOrFail();
        if ($attempt->status === 'submitted') {
            return redirect()->route('student.dashboard')->with('info', 'Already submitted.');
        }

        $data = $request->validate([
            'submission_text' => ['nullable', 'string'],
            'submission_file' => ['nullable', 'image', 'mimes:png,jpg,jpeg,gif', 'max:10240'],
        ]);

        $filePath = null;
        if ($request->hasFile('submission_file')) {
            $filePath = $request->file('submission_file')->store('practical-submissions', 'public');
        }

        $attempt->update([
            'submission_text' => $data['submission_text'] ?? null,
            'submission_file' => $filePath,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return redirect()->route('student.practicals.result', ['attempt' => $attempt->id])
            ->with('success', 'Practical submitted.');
    }

    public function result(PracticalAttempt $attempt): Response
    {
        $student = Auth::user();
        abort_if($attempt->student_id !== $student->id, 403);
        $attempt->load(['practical.criteria', 'scores.criterion']);

        return Inertia::render('Student/Practical/Result', ['attempt' => $attempt]);
    }

    public function grade(Practical $practical, PracticalAttempt $attempt): Response
    {
        $this->authorizeOwner($practical);
        abort_if($attempt->practical_id !== $practical->id, 404);

        $attempt->load(['student:id,name,grade', 'practical.criteria', 'scores.criterion']);
        $practical->load('criteria');

        return Inertia::render('Teacher/Practicals/Grade', [
            'practical' => $practical,
            'attempt' => $attempt,
        ]);
    }

    public function gradeUpdate(Request $request, Practical $practical, PracticalAttempt $attempt): RedirectResponse
    {
        $this->authorizeOwner($practical);
        abort_if($attempt->practical_id !== $practical->id, 404);

        $data = $request->validate([
            'scores' => ['required', 'array'],
            'scores.*' => ['required', 'integer', 'min:0'],
            'comments' => ['nullable', 'array'],
            'comments.*' => ['nullable', 'string', 'max:1000'],
        ]);

        $practical->load('criteria');
        $totalScore = 0;

        DB::transaction(function () use ($data, $practical, $attempt, &$totalScore) {
            foreach ($practical->criteria as $criterion) {
                $score = min((int) ($data['scores'][$criterion->id] ?? 0), $criterion->max_points);
                $totalScore += $score;

                $attempt->scores()->updateOrCreate(
                    ['criterion_id' => $criterion->id],
                    ['score' => $score, 'comment' => $data['comments'][$criterion->id] ?? '']
                );
            }

            $attempt->update(['total_score' => $totalScore]);
        });

        return redirect()->route('teacher.practicals.grade', [$practical, $attempt])
            ->with('saved', true);
    }

    public function recheck(Practical $practical, PracticalAttempt $attempt): Response
    {
        $this->authorizeOwner($practical);
        abort_if($attempt->practical_id !== $practical->id, 404);

        $attempt->load(['student:id,name,grade', 'practical.criteria', 'scores.criterion']);
        $practical->load('criteria');

        return Inertia::render('Teacher/Practicals/Recheck', [
            'practical' => $practical,
            'attempt' => $attempt,
        ]);
    }

    public function recheckUpdate(Request $request, Practical $practical, PracticalAttempt $attempt): RedirectResponse
    {
        $this->authorizeOwner($practical);
        abort_if($attempt->practical_id !== $practical->id, 404);

        $data = $request->validate([
            'scores' => ['required', 'array'],
            'scores.*' => ['required', 'integer', 'min:0'],
            'comments' => ['nullable', 'array'],
            'comments.*' => ['nullable', 'string', 'max:1000'],
        ]);

        $practical->load('criteria');
        $totalScore = 0;

        DB::transaction(function () use ($data, $practical, $attempt, &$totalScore) {
            foreach ($practical->criteria as $criterion) {
                $score = min((int) ($data['scores'][$criterion->id] ?? 0), $criterion->max_points);
                $totalScore += $score;

                $attempt->scores()->updateOrCreate(
                    ['criterion_id' => $criterion->id],
                    ['score' => $score, 'comment' => $data['comments'][$criterion->id] ?? '']
                );
            }
            $attempt->update(['total_score' => $totalScore]);
        });

        return redirect()->route('teacher.practicals.recheck', [$practical, $attempt])
            ->with('saved', true);
    }

    public function reassign(Request $request, Practical $practical): RedirectResponse
    {
        abort_unless(Auth::user()->isSuperadmin(), 403);

        $data = $request->validate(['teacher_id' => ['required', 'exists:users,id']]);
        $practical->update(['teacher_id' => $data['teacher_id']]);

        return back()->with('success', 'Practical reassigned to teacher.');
    }

    private function authorizeOwner(Practical $practical): void
    {
        if (Auth::user()->isSuperadmin()) return;
        abort_if($practical->teacher_id !== Auth::id(), 403);
    }
}
