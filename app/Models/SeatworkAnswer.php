<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeatworkAnswer extends Model
{
    use HasFactory;

    protected $fillable = ['attempt_id', 'question_id', 'answer_text', 'selected_option_id', 'matching_answers', 'is_correct'];

    protected function casts(): array
    {
        return ['is_correct' => 'boolean', 'matching_answers' => 'array'];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(SeatworkAttempt::class, 'attempt_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(SeatworkQuestion::class, 'question_id');
    }

    public function selectedOption(): BelongsTo
    {
        return $this->belongsTo(SeatworkOption::class, 'selected_option_id');
    }
}
