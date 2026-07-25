<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAnswer extends Model
{
    use HasFactory;

    protected $fillable = ['exam_attempt_id', 'exam_question_id', 'answer_text', 'selected_option_id', 'matching_answers', 'is_correct', 'points_earned'];

    protected function casts(): array
    {
        return ['is_correct' => 'boolean', 'matching_answers' => 'array'];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'exam_attempt_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(ExamQuestion::class, 'exam_question_id');
    }

    public function selectedOption(): BelongsTo
    {
        return $this->belongsTo(ExamOption::class, 'selected_option_id');
    }
}
