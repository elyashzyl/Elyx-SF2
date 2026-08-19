<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\GradeLevel;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class Grade8ProgrammingGamesSeeder extends Seeder
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

        $gradeName = $gradeLevel->name;

        $games = [
            [
                'title' => 'Introduction to Programming',
                'description' => 'Learn what programming is, who programmers are, programming languages, algorithms, and flowcharts.',
                'type' => 'quiz',
                'cards' => [
                    ['question' => 'What is a set of instructions that tells a computer what to do?', 'answer' => 'Programming', 'options' => ['Programming', 'Hardware', 'Internet', 'Compiler']],
                    ['question' => 'A person who writes instructions for a computer to follow is called a ___', 'answer' => 'Programmer', 'options' => ['Programmer', 'Analyst', 'Designer', 'Operator']],
                    ['question' => 'Which of the following is a high-level programming language?', 'answer' => 'Python', 'options' => ['Python', 'Binary', 'Assembly', 'Machine code']],
                    ['question' => 'What is a step-by-step procedure used to solve a problem called?', 'answer' => 'Algorithm', 'options' => ['Algorithm', 'Compiler', 'Debugger', 'Variable']],
                    ['question' => 'What is a diagram that uses shapes and arrows to represent an algorithm?', 'answer' => 'Flowchart', 'options' => ['Flowchart', 'Spreadsheet', 'Blueprint', 'Data table']],
                    ['question' => 'Which shape in a flowchart is used to represent a decision?', 'answer' => 'Diamond', 'options' => ['Diamond', 'Oval', 'Rectangle', 'Parallelogram']],
                    ['question' => 'Which shape in a flowchart represents the start or end of a program?', 'answer' => 'Oval', 'options' => ['Oval', 'Diamond', 'Rectangle', 'Arrow']],
                    ['question' => 'Which shape in a flowchart is used for processing steps or calculations?', 'answer' => 'Rectangle', 'options' => ['Rectangle', 'Diamond', 'Oval', 'Parallelogram']],
                    ['question' => 'What do arrows show in a flowchart?', 'answer' => 'Direction of flow', 'options' => ['Direction of flow', 'Data storage', 'A decision', 'Printed output']],
                    ['question' => 'Which of the following is a low-level language?', 'answer' => 'Machine code', 'options' => ['Machine code', 'Python', 'JavaScript', 'Java']],
                    ['question' => 'Which type of language is closest to how humans read and write?', 'answer' => 'High-level language', 'options' => ['High-level language', 'Low-level language', 'Machine code', 'Binary']],
                    ['question' => 'The set of instructions a computer follows is called a ___', 'answer' => 'Program', 'options' => ['Program', 'Hardware', 'Keyboard', 'Monitor']],
                ],
            ],
            [
                'title' => 'Introduction to Python',
                'description' => 'Learn about the Python environment, PyCharm IDE, running programs, the print() function, and Python syntax.',
                'type' => 'flashcard',
                'cards' => [
                    ['question' => 'What is the popular IDE used in class to write and run Python programs?', 'answer' => 'PyCharm'],
                    ['question' => 'What function is used to display output on the screen in Python?', 'answer' => 'print()'],
                    ['question' => 'What file extension do Python source files use?', 'answer' => '.py'],
                    ['question' => 'What is the interactive tool in Python where you can type and run code one line at a time called?', 'answer' => 'Python Interpreter'],
                    ['question' => 'What is the built-in editor that comes with Python called?', 'answer' => 'IDLE'],
                    ['question' => 'What is the set of rules that a Python program must follow called?', 'answer' => 'Python Syntax'],
                    ['question' => 'Which window in PyCharm shows the output of your program?', 'answer' => 'Run window'],
                    ['question' => 'In print("Hello"), what is "Hello" called?', 'answer' => 'A string'],
                    ['question' => 'What does print() do after it finishes printing?', 'answer' => 'Moves to a new line'],
                    ['question' => 'What must you press to run a Python program in PyCharm?', 'answer' => 'The Run button'],
                ],
            ],
            [
                'title' => 'Variables',
                'description' => 'Learn variable naming rules, data types, and the assignment operator.',
                'type' => 'quiz',
                'cards' => [
                    ['question' => 'Which of the following is a valid variable name in Python?', 'answer' => 'student_name', 'options' => ['student_name', '2students', 'my-name', 'class']],
                    ['question' => 'What is the data type of the value "Hello"?', 'answer' => 'String', 'options' => ['String', 'Integer', 'Float', 'Boolean']],
                    ['question' => 'What is the data type of the value 42?', 'answer' => 'Integer', 'options' => ['Integer', 'String', 'Float', 'Boolean']],
                    ['question' => 'What is the data type of the value 3.14?', 'answer' => 'Float', 'options' => ['Float', 'Integer', 'String', 'Boolean']],
                    ['question' => 'What is the data type of the value True?', 'answer' => 'Boolean', 'options' => ['Boolean', 'String', 'Integer', 'Float']],
                    ['question' => 'Which operator assigns a value to a variable?', 'answer' => '=', 'options' => ['=', '==', '+=', '->']],
                    ['question' => 'Which of these is NOT a valid variable name in Python?', 'answer' => 'if', 'options' => ['if', 'total_score', 'player_name', 'result']],
                    ['question' => 'A variable name must NOT contain which of the following?', 'answer' => 'spaces', 'options' => ['spaces', 'letters', 'numbers', 'underscores']],
                    ['question' => 'Which naming style uses underscores, like total_score?', 'answer' => 'snake_case', 'options' => ['snake_case', 'camelCase', 'PascalCase', 'kebab-case']],
                    ['question' => 'What is the value of x after the code x = 10 runs?', 'answer' => '10', 'options' => ['10', '0', 'x', 'None']],
                    ['question' => 'What do we call the memory location that stores a value in a program?', 'answer' => 'Variable', 'options' => ['Variable', 'Function', 'Loop', 'Module']],
                    ['question' => 'A variable that holds true or false has which data type?', 'answer' => 'Boolean', 'options' => ['Boolean', 'String', 'Integer', 'Float']],
                ],
            ],
            [
                'title' => 'Arithmetic Operators',
                'description' => 'Practice addition, subtraction, multiplication, division, modulo, and order of operations.',
                'type' => 'fillblank',
                'cards' => [
                    ['question' => 'What is the result of 15 + 6?', 'answer' => '21'],
                    ['question' => 'What is the result of 9 * 8?', 'answer' => '72'],
                    ['question' => 'What is the result of 20 - 7?', 'answer' => '13'],
                    ['question' => 'What is the result of 18 / 3?', 'answer' => '6'],
                    ['question' => 'What is the remainder when 17 is divided by 5?', 'answer' => '2'],
                    ['question' => 'What is the result of 2 + 3 * 4?', 'answer' => '14'],
                    ['question' => 'What is the result of 10 + 5 * 2?', 'answer' => '20'],
                    ['question' => 'What is the result of (10 + 5) * 2?', 'answer' => '30'],
                    ['question' => 'In Python, which symbol is used for addition?', 'answer' => '+'],
                    ['question' => 'Which symbol gives the remainder of a division in Python?', 'answer' => '%'],
                    ['question' => 'What is the result of 25 - 8?', 'answer' => '17'],
                    ['question' => 'What is the result of 6 * 6?', 'answer' => '36'],
                ],
            ],
            [
                'title' => 'Input and Output Statements',
                'description' => 'Learn input(), print(), converting input with int() and float(), and simple interactive programs.',
                'type' => 'fillblank',
                'cards' => [
                    ['question' => 'What function is used to get a value typed by the user in Python?', 'answer' => 'input()'],
                    ['question' => 'What function is used to show text on the screen in Python?', 'answer' => 'print()'],
                    ['question' => 'What function converts a string like "10" into the number 10?', 'answer' => 'int()'],
                    ['question' => 'What function converts a string like "3.5" into 3.5?', 'answer' => 'float()'],
                    ['question' => 'The input() function always returns a value of which data type?', 'answer' => 'string'],
                    ['question' => 'A program that asks for input, processes it, and shows output is called a ___ program.', 'answer' => 'interactive'],
                    ['question' => 'Complete the code: name = ___("Enter your name: ")', 'answer' => 'input'],
                    ['question' => 'Complete the code to include the variable name: print("Hello", ___)', 'answer' => 'name'],
                    ['question' => 'What is the text inside input("...") that tells the user what to type called?', 'answer' => 'prompt'],
                    ['question' => 'The value placed inside print("...") is called an ___', 'answer' => 'argument'],
                    ['question' => 'What function converts a value into a string?', 'answer' => 'str()'],
                    ['question' => 'After print() finishes, the cursor moves to the next ___', 'answer' => 'line'],
                ],
            ],
            [
                'title' => 'Comparison Operators',
                'description' => 'Learn comparison operators, logical operators (and, or, not), and boolean expressions.',
                'type' => 'quiz',
                'cards' => [
                    ['question' => 'Which operator checks if two values are equal in Python?', 'answer' => '==', 'options' => ['==', '=', '!=', '<=']],
                    ['question' => 'Which operator checks if two values are NOT equal?', 'answer' => '!=', 'options' => ['!=', '==', '!', '<>']],
                    ['question' => 'Which operator means "greater than or equal to"?', 'answer' => '>=', 'options' => ['>=', '>', '=>', '<=']],
                    ['question' => 'What is the result of True and True in Python?', 'answer' => 'True', 'options' => ['True', 'False', '1', '0']],
                    ['question' => 'What is the result of not True in Python?', 'answer' => 'False', 'options' => ['False', 'True', '0', 'None']],
                    ['question' => 'What is the result of the expression 5 > 8?', 'answer' => 'False', 'options' => ['False', 'True', '5', '8']],
                    ['question' => 'Which operator means "less than"?', 'answer' => '<', 'options' => ['<', '>', '<=', '=<']],
                    ['question' => 'Which operator means "greater than"?', 'answer' => '>', 'options' => ['>', '<', '>=', '=>']],
                    ['question' => 'What is the result of 10 <= 10?', 'answer' => 'True', 'options' => ['True', 'False', '10', '1']],
                    ['question' => 'What is the result of 3 == "3"?', 'answer' => 'False', 'options' => ['False', 'True', 'Error', 'None']],
                    ['question' => 'What is the result of True or False?', 'answer' => 'True', 'options' => ['True', 'False', '0', 'None']],
                    ['question' => 'What is the result of True and False?', 'answer' => 'False', 'options' => ['False', 'True', '1', 'None']],
                ],
            ],
            [
                'title' => 'Debugging',
                'description' => 'Learn about syntax errors, logic errors, indentation, comments, and coding standards.',
                'type' => 'quiz',
                'cards' => [
                    ['question' => 'An error caused by wrong spelling or missing punctuation is called a ___ error.', 'answer' => 'Syntax', 'options' => ['Syntax', 'Logic', 'Runtime', 'Hardware']],
                    ['question' => 'An error where the program runs but gives the wrong result is called a ___ error.', 'answer' => 'Logic', 'options' => ['Logic', 'Syntax', 'Compiler', 'Hardware']],
                    ['question' => 'What does the # symbol create in Python?', 'answer' => 'A comment', 'options' => ['A comment', 'A variable', 'A string', 'A function']],
                    ['question' => 'Python uses ___ to show which code belongs inside a block.', 'answer' => 'Indentation', 'options' => ['Indentation', 'Curly braces', 'Semicolons', 'Quotes']],
                    ['question' => 'Writing notes in your code that the computer ignores is called ___', 'answer' => 'Commenting', 'options' => ['Commenting', 'Documentation', 'Output', 'Debugging']],
                    ['question' => 'What is the practice of naming a variable like total_score (with underscores) called?', 'answer' => 'snake_case', 'options' => ['snake_case', 'camelCase', 'PascalCase', 'kebab-case']],
                    ['question' => 'What is the process of finding and fixing errors in a program called?', 'answer' => 'Debugging', 'options' => ['Debugging', 'Compiling', 'Printing', 'Formatting']],
                    ['question' => 'Which type of error stops the program from running at all?', 'answer' => 'Syntax error', 'options' => ['Syntax error', 'Logic error', 'Comment', 'Indentation']],
                    ['question' => 'Which type of error means the program runs but produces wrong output?', 'answer' => 'Logic error', 'options' => ['Logic error', 'Syntax error', 'Print error', 'Spelling error']],
                    ['question' => 'Comments in Python always start with which symbol?', 'answer' => '#', 'options' => ['#', '//', '/*', '--']],
                    ['question' => 'Good programmers use ___ variable names that describe what the variable stores.', 'answer' => 'descriptive', 'options' => ['descriptive', 'short', 'random', 'uppercase']],
                    ['question' => 'What do you call the guidelines for writing clean, consistent code?', 'answer' => 'Coding standards', 'options' => ['Coding standards', 'Hardware specs', 'User manual', 'Test plan']],
                ],
            ],
        ];

        foreach ($games as $gameData) {
            $cards = $gameData['cards'];
            unset($gameData['cards']);

            Game::where('teacher_id', $teacher->id)
                ->where('title', $gameData['title'])
                ->delete();

            $game = Game::create([
                'teacher_id' => $teacher->id,
                'subject' => 'Computer Science',
                'grade' => $gradeName,
                'xp_reward' => 15,
                'hidden' => false,
                ...$gameData,
            ]);

            $game->cards()->createMany(
                array_map(fn ($card, $i) => $card + ['order' => $i], $cards, array_keys($cards))
            );

            $this->command->info("Created game: {$game->title} ({$game->cards()->count()} cards, {$game->xp_reward} XP)");
        }
    }
}
