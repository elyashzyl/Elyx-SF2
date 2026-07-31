<?php

namespace App\Console\Commands;

use App\Models\StudentPoint;
use App\Models\User;
use Illuminate\Console\Command;

class RecalculatePoints extends Command
{
    protected $signature = 'points:recalc';
    protected $description = 'Recalculate total_points for all students from student_points table';

    public function handle(): int
    {
        $count = 0;
        foreach (User::where('role', 'student')->get() as $u) {
            $u->total_points = StudentPoint::where('student_id', $u->id)->sum('points');
            $u->save();
            $count++;
        }
        $this->info("Recalculated {$count} students.");
        return Command::SUCCESS;
    }
}
