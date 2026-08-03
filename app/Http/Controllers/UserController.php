<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $teacher = Auth::user();
        abort_unless($teacher->isSuperadmin(), 403);

        $users = User::with('section:id,name', 'gradeLevel:id,name')
            ->orderBy('role')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'gender', 'grade', 'grade_level_id', 'section_id', 'created_at']);

        $gradeLevels = \App\Models\GradeLevel::orderBy('name')->get(['id', 'name']);
        $sections = \App\Models\Section::orderBy('name')->get(['id', 'name', 'grade_level_id']);

        return Inertia::render('Teacher/Users', [
            'users' => $users,
            'gradeLevels' => $gradeLevels,
            'sections' => $sections,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $teacher = Auth::user();
        abort_unless($teacher->isSuperadmin(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => ['required', Rule::in(['student', 'teacher', 'superadmin'])],
            'password' => ['required', 'string', 'min:8'],
            'gender' => ['nullable', 'string', 'in:Male,Female'],
            'grade_level_id' => ['nullable', 'integer', 'exists:grade_levels,id'],
            'section_id' => ['nullable', 'integer', 'exists:sections,id'],
        ]);

        $validated['password'] = bcrypt($validated['password']);
        $validated['email_verified_at'] = now();

        User::create($validated);

        return back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $teacher = Auth::user();
        abort_unless($teacher->isSuperadmin(), 403);

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', Rule::in(['student', 'teacher', 'superadmin'])],
            'gender' => ['nullable', 'string', 'in:Male,Female'],
            'grade_level_id' => ['nullable', 'integer', 'exists:grade_levels,id'],
            'section_id' => ['nullable', 'integer', 'exists:sections,id'],
        ];

        if ($request->filled('password')) {
            $rules['password'] = ['required', 'string', 'min:8'];
        }

        $validated = $request->validate($rules);

        if ($request->filled('password')) {
            $validated['password'] = bcrypt($validated['password']);
        }

        $user->update($validated);

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $teacher = Auth::user();
        abort_unless($teacher->isSuperadmin(), 403);
        abort_if($user->id === $teacher->id, 403, 'You cannot delete your own account.');

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }

    public function impersonate(User $user): RedirectResponse
    {
        $admin = Auth::user();
        abort_unless($admin->isSuperadmin(), 403);
        abort_if($user->id === $admin->id, 403, 'You are already logged in as this user.');

        session(['impersonated_by' => $admin->id]);
        Auth::login($user);

        $dashboard = $user->isTeacher() || $user->isSuperadmin()
            ? route('teacher.dashboard')
            : route('student.dashboard');

        return redirect($dashboard)->with('success', "Now impersonating {$user->name}.");
    }

    public function leaveImpersonation(): RedirectResponse
    {
        $originalId = session('impersonated_by');
        if ($originalId) {
            Auth::loginUsingId($originalId);
            session()->forget('impersonated_by');
        }
        return redirect()->route('teacher.dashboard');
    }

    public function toggleSystemMessenger(): RedirectResponse
    {
        abort_unless(Auth::user()->isSuperadmin(), 403);
        $setting = \App\Models\Setting::find('messenger_system_enabled');
        $setting->value = $setting->value === 'true' ? 'false' : 'true';
        $setting->save();
        return redirect()->route('teacher.users.index');
    }
}
