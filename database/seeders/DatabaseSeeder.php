<?php

namespace Database\Seeders;

use App\Models\GradeLevel;
use App\Models\Game;
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

        $colorGame = Game::create([
            'teacher_id' => $teacher->id,
            'title' => 'Color Theory & Harmony',
            'subject' => 'Arts',
            'grade' => 'Grade 10',
            'description' => 'Pick the swatch that completes the correct color harmony.',
            'xp_reward' => 2,
            'type' => 'colorharmony',
        ]);

        $colorGame->cards()->createMany([
            [
                'question' => 'Which color is complementary to this red?',
                'answer' => '#06B6D4', 'color' => '#DC2626', 'order' => 0,
                'options' => ['#06B6D4', '#3B82F6', '#7C3AED', '#F59E0B', '#EC4899'],
            ],
            [
                'question' => 'Which color is complementary to this blue?',
                'answer' => '#F59E0B', 'color' => '#2563EB', 'order' => 1,
                'options' => ['#F59E0B', '#22C55E', '#EF4444', '#06B6D4'],
            ],
            [
                'question' => 'Which color is complementary to this green?',
                'answer' => '#D946EF', 'color' => '#16A34A', 'order' => 2,
                'options' => ['#D946EF', '#F97316', '#3B82F6', '#84CC16'],
            ],
            [
                'question' => 'Which swatch is a monochromatic (same-hue) variant of this violet?',
                'answer' => '#A78BFA', 'color' => '#7C3AED', 'order' => 3,
                'options' => ['#A78BFA', '#22C55E', '#FB923C', '#F472B6'],
            ],
            [
                'question' => 'Which color is analogous (neighbor) to this orange?',
                'answer' => '#EAB308', 'color' => '#F97316', 'order' => 4,
                'options' => ['#EAB308', '#2563EB', '#22C55E', '#7C3AED', '#EF4444'],
            ],
        ]);
    }
}
