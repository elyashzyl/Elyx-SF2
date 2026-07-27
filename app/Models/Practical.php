<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Practical extends Model
{
    use HasFactory;

    protected $fillable = ['teacher_id', 'title', 'grade', 'instructions', 'time_limit_minutes', 'max_score', 'is_published'];

    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function gradeLevels(): BelongsToMany
    {
        return $this->belongsToMany(GradeLevel::class, 'practical_grade_level');
    }

    public function criteria(): HasMany
    {
        return $this->hasMany(PracticalCriterion::class)->orderBy('order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(PracticalAttempt::class);
    }

    public function totalMaxPoints(): int
    {
        return $this->criteria()->sum('max_points');
    }
}
