<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SeatworkAttempt extends Model
{
    use HasFactory;

    protected $fillable = ['seatwork_id', 'student_id', 'status', 'score', 'total_points', 'started_at', 'submitted_at'];

    public function seatwork(): BelongsTo
    {
        return $this->belongsTo(Seatwork::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(SeatworkAnswer::class, 'attempt_id');
    }
}
