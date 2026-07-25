<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PracticalScore extends Model
{
    use HasFactory;

    protected $fillable = ['attempt_id', 'criterion_id', 'score', 'comment'];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(PracticalAttempt::class, 'attempt_id');
    }

    public function criterion(): BelongsTo
    {
        return $this->belongsTo(PracticalCriterion::class, 'criterion_id');
    }
}
