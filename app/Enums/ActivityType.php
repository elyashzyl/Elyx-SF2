<?php

namespace App\Enums;

enum ActivityType: string
{
    case Login     = 'Login';
    case Quiz      = 'Quiz';
    case Seatwork  = 'Seatwork';
    case Practical = 'Practical';
    case Exam      = 'Exam';
    case Game      = 'Game';
    case Message   = 'Message';
    case Manual    = 'Manual';
    case Deduction = 'Deduction';
}