<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamSection extends Model
{
    use HasFactory;

    protected $fillable = ['exam_id', 'section_type', 'title', 'instructions', 'order'];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class, 'exam_section_id')->orderBy('order');
    }

    public function criteria(): HasMany
    {
        return $this->hasMany(ExamCriterion::class, 'exam_section_id')->orderBy('order');
    }
}
