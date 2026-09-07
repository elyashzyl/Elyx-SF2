<?php

namespace App\Enums;

enum GameType: string
{
    case Flashcard     = 'flashcard';
    case Quiz          = 'quiz';
    case FillBlank     = 'fillblank';
    case TrueFalse     = 'truefalse';
    case WordJumble    = 'wordjumble';
    case ColorHarmony  = 'colorharmony';
    case MemoryMatch   = 'memorymatch';
    case Hangman       = 'hangman';
    case SpeedQuiz     = 'speedquiz';
    case DragDrop      = 'dragdrop';
    case Ordering      = 'ordering';

    /**
     * Pipe-separated string for validation rules.
     */
    public static function validationList(): string
    {
        return implode(',', array_column(self::cases(), 'value'));
    }
}