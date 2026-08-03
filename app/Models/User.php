<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $role
 * @property string|null $grade
 * @property int|null $grade_level_id
 * @property int|null $section_id
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'role', 'grade', 'grade_level_id', 'section_id', 'gender'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    public function isSuperadmin(): bool
    {
        return $this->role === 'superadmin';
    }

    public function isTeacher(): bool
    {
        return $this->isSuperadmin() || $this->role === 'teacher';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'student_teacher', 'student_id', 'teacher_id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'student_teacher', 'teacher_id', 'student_id');
    }

    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withPivot('last_read_at')
            ->withTimestamps();
    }

    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class, 'teacher_id');
    }

    public function seatworks(): HasMany
    {
        return $this->hasMany(Seatwork::class, 'teacher_id');
    }

    public function practicals(): HasMany
    {
        return $this->hasMany(Practical::class, 'teacher_id');
    }

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class, 'teacher_id');
    }

    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class, 'student_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }
}
