<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuarterlyEvent extends Model
{
    protected $fillable = ['event_name', 'first_grading', 'second_grading', 'third_grading', 'fourth_grading'];
}
