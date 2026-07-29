<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PracticalAttempt extends Model
{
    use HasFactory;

    protected $fillable = ['practical_id', 'student_id', 'status', 'total_score', 'submission_text', 'submission_file', 'started_at', 'submitted_at'];

    protected $casts = [
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    protected $appends = ['submission_file_url'];

    public function getSubmissionFileUrlAttribute(): ?string
    {
        return $this->submission_file ? url('storage/' . $this->submission_file) : null;
    }

    public function practical(): BelongsTo
    {
        return $this->belongsTo(Practical::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function scores(): HasMany
    {
        return $this->hasMany(PracticalScore::class, 'attempt_id');
    }
}
