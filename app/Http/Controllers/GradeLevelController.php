<?php

namespace App\Http\Controllers;

use App\Models\GradeLevel;
use App\Models\Section;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradeLevelController extends Controller
{
    public function index(): Response
    {
        $gradeLevels = GradeLevel::with('sections')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Teacher/GradeLevels/Index', [
            'gradeLevels' => $gradeLevels,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Teacher/GradeLevels/Form', [
            'gradeLevel' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:grade_levels,name'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        GradeLevel::create([
            'name' => $data['name'],
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return redirect()->route('teacher.grade-levels.index')
            ->with('success', 'Grade level created successfully.');
    }

    public function edit(GradeLevel $gradeLevel): Response
    {
        $gradeLevel->load('sections');

        return Inertia::render('Teacher/GradeLevels/Form', [
            'gradeLevel' => $gradeLevel,
        ]);
    }

    public function update(Request $request, GradeLevel $gradeLevel): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:grade_levels,name,' . $gradeLevel->id],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $gradeLevel->update([
            'name' => $data['name'],
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return redirect()->route('teacher.grade-levels.index')
            ->with('success', 'Grade level updated successfully.');
    }

    public function destroy(GradeLevel $gradeLevel): RedirectResponse
    {
        $gradeLevel->delete();

        return redirect()->route('teacher.grade-levels.index')
            ->with('success', 'Grade level deleted.');
    }

    public function storeSection(Request $request, GradeLevel $gradeLevel): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:sections,name,NULL,id,grade_level_id,' . $gradeLevel->id],
            'is_active' => ['boolean'],
        ]);

        $gradeLevel->sections()->create([
            'name' => $data['name'],
            'is_active' => $data['is_active'] ?? true,
        ]);

        return redirect()->route('teacher.grade-levels.index')
            ->with('success', 'Section added to ' . $gradeLevel->name . '.');
    }

    public function destroySection(GradeLevel $gradeLevel, Section $section): RedirectResponse
    {
        if ($section->grade_level_id !== $gradeLevel->id) {
            abort(403);
        }

        $section->delete();

        return redirect()->route('teacher.grade-levels.index')
            ->with('success', 'Section deleted.');
    }
}
