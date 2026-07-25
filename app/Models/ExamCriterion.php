<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamCriterion extends Model
{
    use HasFactory;

    protected $fillable = ['exam_section_id', 'criterion_name', 'description', 'max_points', 'order'];

    public function section(): BelongsTo
    {
        return $this->belongsTo(ExamSection::class, 'exam_section_id');
    }

    public function scores(): HasMany
    {
        return $this->hasMany(ExamSectionScore::class, 'exam_criterion_id');
    }
}
