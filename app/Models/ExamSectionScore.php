<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamSectionScore extends Model
{
    use HasFactory;

    protected $fillable = ['exam_attempt_id', 'exam_criterion_id', 'exam_section_id', 'score', 'comment'];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'exam_attempt_id');
    }

    public function criterion(): BelongsTo
    {
        return $this->belongsTo(ExamCriterion::class, 'exam_criterion_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(ExamSection::class, 'exam_section_id');
    }
}
