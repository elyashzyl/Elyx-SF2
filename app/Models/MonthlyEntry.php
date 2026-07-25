<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlyEntry extends Model
{
    protected $fillable = ['record_id', 'student_id', 'student_name', 'days', 'present', 'absent', 'tardy', 'remarks', 'late_enrollee'];

    protected function casts(): array
    {
        return ['days' => 'array', 'late_enrollee' => 'boolean'];
    }

    public function record(): BelongsTo
    {
        return $this->belongsTo(MonthlyRecord::class, 'record_id');
    }
}
