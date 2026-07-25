<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttendanceRecord extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['date', 'grade', 'section', 'adviser', 'created_by', 'created_by_name'];

    public function entries(): HasMany
    {
        return $this->hasMany(AttendanceEntry::class, 'record_id');
    }
}
