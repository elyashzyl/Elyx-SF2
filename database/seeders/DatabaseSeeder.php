<?php

namespace Database\Seeders;

use App\Models\GradeLevel;
use App\Models\Quiz;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $grade7 = GradeLevel::create(['name' => 'Grade 7', 'display_order' => 7, 'is_active' => true]);
        $grade8 = GradeLevel::create(['name' => 'Grade 8', 'display_order' => 8, 'is_active' => true]);
        $grade9 = GradeLevel::create(['name' => 'Grade 9', 'display_order' => 9, 'is_active' => true]);
        $grade10 = GradeLevel::create(['name' => 'Grade 10', 'display_order' => 10, 'is_active' => true]);
        GradeLevel::create(['name' => 'Grade 11', 'display_order' => 11, 'is_active' => true]);
        GradeLevel::create(['name' => 'Grade 12', 'display_order' => 12, 'is_active' => true]);

        $sectionNames = ['Rizal', 'Mabini', 'Bonifacio', 'Aguinaldo'];
        $sectionsByGrade = [];
        foreach ([$grade7, $grade8, $grade9, $grade10] as $grade) {
            foreach ($sectionNames as $name) {
                $sectionsByGrade[$grade->id][] = Section::create([
                    'grade_level_id' => $grade->id,
                    'name' => $name,
                    'is_active' => true,
                ]);
            }
        }

        $teacher = User::create([
            'name' => 'Mrs. Santos',
            'email' => 'teacher@example.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'email_verified_at' => now(),
        ]);

        $rizalSec = collect($sectionsByGrade[$grade10->id])->firstWhere('name', 'Rizal');

        $student = User::create([
            'name' => 'Juan Dela Cruz',
            'email' => 'student@example.com',
            'password' => Hash::make('password'),
            'role' => 'student',
            'grade' => 'Grade 10',
            'grade_level_id' => $grade10->id,
            'section_id' => $rizalSec->id,
            'email_verified_at' => now(),
        ]);

        $student->teachers()->attach($teacher->id);

        $quiz = $teacher->quizzes()->create([
            'title' => 'Basic Science: Cells',
            'description' => 'A short review quiz on cell structure and function.',
            'grade' => 'Grade 10',
            'time_limit_minutes' => 10,
            'is_published' => true,
        ]);

        $quiz->gradeLevels()->attach([$grade10->id]);
        $quiz->sections()->attach([$rizalSec->id]);

        $q1 = $quiz->questions()->create([
            'question_text' => 'What is the powerhouse of the cell?',
            'type' => 'multiple_choice',
            'points' => 1,
            'order' => 0,
        ]);
        $q1->options()->createMany([
            ['option_text' => 'Mitochondria', 'is_correct' => true, 'order' => 0],
            ['option_text' => 'Nucleus', 'is_correct' => false, 'order' => 1],
            ['option_text' => 'Ribosome', 'is_correct' => false, 'order' => 2],
            ['option_text' => 'Golgi apparatus', 'is_correct' => false, 'order' => 3],
        ]);

        $q2 = $quiz->questions()->create([
            'question_text' => 'Plant cells have a cell wall.',
            'type' => 'true_false',
            'points' => 1,
            'order' => 1,
        ]);
        $q2->options()->createMany([
            ['option_text' => 'True', 'is_correct' => true, 'order' => 0],
            ['option_text' => 'False', 'is_correct' => false, 'order' => 1],
        ]);
    }
}
