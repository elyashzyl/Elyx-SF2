<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceEntry extends Model
{
    protected $fillable = ['record_id', 'student_id', 'name', 'am1', 'am2', 'am3', 'am4', 'am5', 'am6', 'pm1', 'pm2', 'pm3', 'pm4', 'reason', 'excused', 'unexcused', 'nls'];

    protected function casts(): array
    {
        return ['excused' => 'boolean', 'unexcused' => 'boolean', 'nls' => 'boolean'];
    }

    public function record(): BelongsTo
    {
        return $this->belongsTo(AttendanceRecord::class, 'record_id');
    }
}
