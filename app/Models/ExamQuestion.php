<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamQuestion extends Model
{
    use HasFactory;

    protected $fillable = ['exam_section_id', 'question_text', 'type', 'points', 'order'];

    public function section(): BelongsTo
    {
        return $this->belongsTo(ExamSection::class, 'exam_section_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(ExamOption::class, 'exam_question_id')->orderBy('order');
    }

    public function matchingPairs(): HasMany
    {
        return $this->hasMany(ExamMatchingPair::class, 'exam_question_id')->orderBy('order');
    }
}
