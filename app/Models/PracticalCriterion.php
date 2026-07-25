<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PracticalCriterion extends Model
{
    use HasFactory;

    protected $fillable = ['practical_id', 'criterion_name', 'description', 'max_points', 'order'];

    public function practical(): BelongsTo
    {
        return $this->belongsTo(Practical::class);
    }

    public function scores(): HasMany
    {
        return $this->hasMany(PracticalScore::class, 'criterion_id');
    }
}
