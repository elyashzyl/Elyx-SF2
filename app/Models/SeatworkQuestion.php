<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SeatworkQuestion extends Model
{
    use HasFactory;

    protected $fillable = ['seatwork_id', 'question_text', 'type', 'points', 'order'];

    public function seatwork(): BelongsTo
    {
        return $this->belongsTo(Seatwork::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(SeatworkOption::class, 'question_id')->orderBy('order');
    }

    public function matchingPairs(): HasMany
    {
        return $this->hasMany(SeatworkMatchingPair::class, 'question_id')->orderBy('order');
    }
}
