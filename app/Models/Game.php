<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Game extends Model
{
    protected $fillable = ['teacher_id', 'title', 'subject', 'grade', 'description', 'xp_reward', 'type'];
    protected $casts = ['xp_reward' => 'integer'];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function cards(): HasMany
    {
        return $this->hasMany(GameCard::class)->orderBy('order');
    }
}
