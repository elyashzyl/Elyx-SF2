<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function create(array $input): User
    {
        $input['teacher_ids'] = $input['teacher_ids'] ?? [];

        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'role' => ['required', Rule::in(['teacher', 'student'])],
            'teacher_ids' => [Rule::requiredIf(fn () => ($input['role'] ?? 'student') === 'student'), 'nullable', 'array'],
            'teacher_ids.*' => ['integer', 'exists:users,id'],
            'grade' => [Rule::requiredIf(fn () => ($input['role'] ?? 'student') === 'student'), 'nullable', 'string', 'max:50'],
            'grade_level_id' => [Rule::requiredIf(fn () => ($input['role'] ?? 'student') === 'student'), 'nullable', 'exists:grade_levels,id'],
            'section_id' => [Rule::requiredIf(fn () => ($input['role'] ?? 'student') === 'student'), 'nullable', 'exists:sections,id'],
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
            'role' => $input['role'],
            'grade' => $input['role'] === 'student' ? $input['grade'] : null,
            'grade_level_id' => $input['role'] === 'student' ? $input['grade_level_id'] : null,
            'section_id' => $input['role'] === 'student' ? $input['section_id'] : null,
        ]);

        if ($input['role'] === 'student' && !empty($input['teacher_ids'])) {
            $user->teachers()->attach($input['teacher_ids']);
        }

        return $user;
    }
}
