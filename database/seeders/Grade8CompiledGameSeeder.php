<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\GradeLevel;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class Grade8CompiledGameSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $teacher = User::where('role', 'teacher')->orderBy('id')->first()
            ?? User::where('role', 'superadmin')->orderBy('id')->first();

        if (!$teacher) {
            $this->command->error('No teacher or superadmin user found. Create a user first.');

            return;
        }

        $gradeLevel = GradeLevel::where('name', 'Grade 8')->first();

        if (!$gradeLevel) {
            $this->command->error('Grade 8 not found in the grade_levels table. Add it first.');

            return;
        }

        $gameData = [
            'title' => 'All Topics Review',
            'description' => 'A 40-question compiled review covering programming basics, Python, variables, operators, input/output, comparisons, and debugging.',
            'type' => 'quiz',
            'xp_reward' => 15,
            'cards' => [
                // Introduction to Programming
                ['question' => 'What is a set of instructions that tells a computer what to do?', 'answer' => 'Programming', 'options' => ['Programming', 'Hardware', 'Internet', 'Compiler']],
                ['question' => 'A person who writes instructions for a computer to follow is called a ___', 'answer' => 'Programmer', 'options' => ['Programmer', 'Analyst', 'Designer', 'Operator']],
                ['question' => 'Which of the following is a high-level programming language?', 'answer' => 'Python', 'options' => ['Python', 'Binary', 'Assembly', 'Machine code']],
                ['question' => 'What is a step-by-step procedure used to solve a problem called?', 'answer' => 'Algorithm', 'options' => ['Algorithm', 'Compiler', 'Debugger', 'Variable']],
                ['question' => 'What is a diagram that uses shapes and arrows to represent an algorithm?', 'answer' => 'Flowchart', 'options' => ['Flowchart', 'Spreadsheet', 'Blueprint', 'Data table']],
                ['question' => 'Which shape in a flowchart is used to represent a decision?', 'answer' => 'Diamond', 'options' => ['Diamond', 'Oval', 'Rectangle', 'Parallelogram']],
                // Introduction to Python
                ['question' => 'What is the popular IDE used in class to write and run Python programs?', 'answer' => 'PyCharm', 'options' => ['PyCharm', 'IDLE', 'Notepad', 'Microsoft Word']],
                ['question' => 'What function is used to display output on the screen in Python?', 'answer' => 'print()', 'options' => ['print()', 'input()', 'len()', 'range()']],
                ['question' => 'What file extension do Python source files use?', 'answer' => '.py', 'options' => ['.py', '.txt', '.exe', '.doc']],
                ['question' => 'What is the built-in editor that comes with Python called?', 'answer' => 'IDLE', 'options' => ['IDLE', 'PyCharm', 'VS Code', 'Notepad']],
                ['question' => 'What is the set of rules that a Python program must follow called?', 'answer' => 'Syntax', 'options' => ['Syntax', 'Grammar', 'Format', 'Script']],
                ['question' => 'In print("Hello"), what is "Hello" called?', 'answer' => 'A string', 'options' => ['A string', 'A variable', 'A number', 'A comment']],
                // Variables
                ['question' => 'Which of the following is a valid variable name in Python?', 'answer' => 'student_name', 'options' => ['student_name', '2students', 'my-name', 'class']],
                ['question' => 'What is the data type of the value "Hello"?', 'answer' => 'String', 'options' => ['String', 'Integer', 'Float', 'Boolean']],
                ['question' => 'What is the data type of the value 42?', 'answer' => 'Integer', 'options' => ['Integer', 'String', 'Float', 'Boolean']],
                ['question' => 'What is the data type of the value 3.14?', 'answer' => 'Float', 'options' => ['Float', 'Integer', 'String', 'Boolean']],
                ['question' => 'What is the data type of the value True?', 'answer' => 'Boolean', 'options' => ['Boolean', 'String', 'Integer', 'Float']],
                ['question' => 'Which operator assigns a value to a variable?', 'answer' => '=', 'options' => ['=', '==', '+=', '->']],
                // Arithmetic Operators
                ['question' => 'What is the result of 15 + 6?', 'answer' => '21', 'options' => ['21', '18', '19', '16']],
                ['question' => 'What is the result of 9 * 8?', 'answer' => '72', 'options' => ['72', '64', '81', '68']],
                ['question' => 'What is the result of 2 + 3 * 4?', 'answer' => '14', 'options' => ['14', '20', '24', '9']],
                ['question' => 'What is the result of (10 + 5) * 2?', 'answer' => '30', 'options' => ['30', '20', '25', '15']],
                ['question' => 'What is the remainder when 17 is divided by 5?', 'answer' => '2', 'options' => ['2', '3', '4', '1']],
                ['question' => 'Which symbol gives the remainder of a division in Python?', 'answer' => '%', 'options' => ['%', '/', '\\', '//']],
                // Input and Output Statements
                ['question' => 'What function is used to get a value typed by the user in Python?', 'answer' => 'input()', 'options' => ['input()', 'print()', 'int()', 'float()']],
                ['question' => 'What function converts a string like "10" into the number 10?', 'answer' => 'int()', 'options' => ['int()', 'float()', 'str()', 'print()']],
                ['question' => 'The input() function always returns a value of which data type?', 'answer' => 'string', 'options' => ['string', 'integer', 'float', 'boolean']],
                ['question' => 'What is the text inside input("...") that tells the user what to type called?', 'answer' => 'prompt', 'options' => ['prompt', 'argument', 'command', 'syntax']],
                ['question' => 'What function converts a value into a string?', 'answer' => 'str()', 'options' => ['str()', 'int()', 'float()', 'bool()']],
                // Comparison Operators
                ['question' => 'Which operator checks if two values are equal in Python?', 'answer' => '==', 'options' => ['==', '=', '!=', '<=']],
                ['question' => 'Which operator checks if two values are NOT equal?', 'answer' => '!=', 'options' => ['!=', '==', '!', '<>']],
                ['question' => 'Which operator means "greater than or equal to"?', 'answer' => '>=', 'options' => ['>=', '>', '=>', '<=']],
                ['question' => 'What is the result of 5 > 8?', 'answer' => 'False', 'options' => ['False', 'True', '5', '8']],
                ['question' => 'What is the result of 10 <= 10?', 'answer' => 'True', 'options' => ['True', 'False', '10', '1']],
                ['question' => 'What is the result of 3 == "3"?', 'answer' => 'False', 'options' => ['False', 'True', 'Error', 'None']],
                // Debugging
                ['question' => 'An error caused by wrong spelling or missing punctuation is called a ___ error.', 'answer' => 'Syntax', 'options' => ['Syntax', 'Logic', 'Runtime', 'Hardware']],
                ['question' => 'An error where the program runs but gives the wrong result is called a ___ error.', 'answer' => 'Logic', 'options' => ['Logic', 'Syntax', 'Compiler', 'Hardware']],
                ['question' => 'What does the # symbol create in Python?', 'answer' => 'A comment', 'options' => ['A comment', 'A variable', 'A string', 'A function']],
                ['question' => 'Python uses ___ to show which code belongs inside a block.', 'answer' => 'Indentation', 'options' => ['Indentation', 'Curly braces', 'Semicolons', 'Quotes']],
                ['question' => 'What is the process of finding and fixing errors in a program called?', 'answer' => 'Debugging', 'options' => ['Debugging', 'Compiling', 'Printing', 'Formatting']],
            ],
        ];

        $cards = $gameData['cards'];
        unset($gameData['cards']);

        Game::where('teacher_id', $teacher->id)
            ->where('title', $gameData['title'])
            ->delete();

        $game = Game::create([
            'teacher_id' => $teacher->id,
            'subject' => 'Computer Science',
            'grade' => $gradeLevel->name,
            'hidden' => false,
            ...$gameData,
        ]);

        $game->cards()->createMany(
            array_map(fn ($card, $i) => $card + ['order' => $i], $cards, array_keys($cards))
        );

        $this->command->info("Created game: {$game->title} ({$game->cards()->count()} cards, {$game->xp_reward} XP)");
    }
}