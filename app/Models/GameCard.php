<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameCard extends Model
{
    protected $fillable = ['game_id', 'question', 'answer', 'color', 'order', 'options'];
    protected $casts = ['options' => 'array'];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}
