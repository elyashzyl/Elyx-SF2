<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MonthlyRecord extends Model
{
    protected $fillable = ['month', 'year', 'grade', 'section', 'adviser', 'school_head', 'summary_data', 'excluded_dates', 'created_by', 'created_by_name'];

    protected function casts(): array
    {
        return ['summary_data' => 'array', 'excluded_dates' => 'array'];
    }

    public function entries(): HasMany
    {
        return $this->hasMany(MonthlyEntry::class, 'record_id');
    }
}
