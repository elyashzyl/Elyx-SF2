<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherSchedule extends Model
{
    protected $fillable = ['teacher_id', 'day_of_week', 'period', 'start_time', 'end_time', 'subject', 'grade', 'section'];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
