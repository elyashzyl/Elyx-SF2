<?php

return [

    /*
    |--------------------------------------------------------------------------
    | XP Tiers (PointsHelper::calculate)
    |--------------------------------------------------------------------------
    | Minimum percentage thresholds for each tier.
    */
    'xp_tiers' => [
        ['min_pct' => 80, 'points' => 10],
        ['min_pct' => 60, 'points' => 5],
        ['min_pct' => 1,  'points' => 1],
    ],

    /*
    |--------------------------------------------------------------------------
    | Activity Points
    |--------------------------------------------------------------------------
    */
    'login_bonus'          => 5,
    'correct_answer_xp'   => 1,
    'message_milestone'   => 1000,
    'message_milestone_xp' => 10,
    'message_min_chars'   => 10,

    /*
    |--------------------------------------------------------------------------
    | XP Reward Limits
    |--------------------------------------------------------------------------
    */
    'xp_reward_max'       => 100,
    'manual_xp_max'       => 1000,
    'manual_xp_min'       => -1000,

    /*
    |--------------------------------------------------------------------------
    | Activity Types (used with PointsHelper::award)
    |--------------------------------------------------------------------------
    */
    'activity_types' => [
        'login'    => 'Login',
        'quiz'     => 'Quiz',
        'seatwork' => 'Seatwork',
        'practical' => 'Practical',
        'exam'     => 'Exam',
        'game'     => 'Game',
        'message'  => 'Message',
        'manual'   => 'Manual',
        'deduction' => 'Deduction',
    ],

    /*
    |--------------------------------------------------------------------------
    | Game Types
    |--------------------------------------------------------------------------
    */
    'game_types' => [
        'flashcard', 'quiz', 'fillblank', 'truefalse', 'wordjumble',
        'colorharmony', 'memorymatch', 'hangman', 'speedquiz',
        'dragdrop', 'ordering',
    ],

    /*
    |--------------------------------------------------------------------------
    | Game Defaults
    |--------------------------------------------------------------------------
    */
    'hangman_max_mistakes' => 6,
    'speed_quiz_seconds'   => 15,

    /*
    |--------------------------------------------------------------------------
    | Practical Defaults
    |--------------------------------------------------------------------------
    */
    'practical_max_score'   => 100,
    'practical_max_attempts' => 3,

    /*
    |--------------------------------------------------------------------------
    | Exam Defaults
    |--------------------------------------------------------------------------
    */
    'exam_max_score' => 100,

    /*
    |--------------------------------------------------------------------------
    | Attempt Closing Duration
    |--------------------------------------------------------------------------
    | How long after starting an attempt before it auto-closes.
    */
    'attempt_close_after_hours' => 24,

    /*
    |--------------------------------------------------------------------------
    | Notification Limits
    |--------------------------------------------------------------------------
    */
    'notification_limit_teacher' => 30,
    'notification_limit_student_practical' => 20,
    'notification_limit_student_other' => 5,

    /*
    |--------------------------------------------------------------------------
    | Dashboard Activity Limits
    |--------------------------------------------------------------------------
    */
    'dashboard_recent_student' => 5,
    'dashboard_recent_teacher' => 10,

    /*
    |--------------------------------------------------------------------------
    | Messenger Setting Key
    |--------------------------------------------------------------------------
    */
    'messenger_setting_key' => 'messenger_system_enabled',

    /*
    |--------------------------------------------------------------------------
    | Level System
    |--------------------------------------------------------------------------
    */
    'xp_per_level' => 100,

    /*
    |--------------------------------------------------------------------------
    | Level Titles (indexed by level, starting at 1)
    |--------------------------------------------------------------------------
    */
    'level_titles' => [
        'Novice', 'Beginner', 'Explorer', 'Scholar', 'Achiever',
        'Rising Star', 'Skilled', 'Expert', 'Master',
        'Grandmaster', 'Legend', 'Mythic', 'Immortal',
    ],
    'level_title_fallback' => 'Champion',

    /*
    |--------------------------------------------------------------------------
    | Secret Level Rewards (name + description, indexed by level)
    |--------------------------------------------------------------------------
    */
    'level_rewards' => [
        1  => ['name' => 'XP Booster Token',     'description' => 'Earn 2× XP on your very next game. Use it wisely.'],
        2  => ['name' => 'Golden Pencil',         'description' => 'A legendary writing instrument. Perfect for taking notes in style.'],
        3  => ['name' => 'Homework Pass',         'description' => 'Skip one homework assignment, free of charge.'],
        4  => ['name' => 'Brain Power Shield',    'description' => 'Protects you from one wrong answer.'],
        5  => ['name' => 'Time Warp Hourglass',   'description' => 'Add 30 extra seconds to any quiz or game.'],
        6  => ['name' => 'Star Compass',          'description' => 'Always points you toward the right answer.'],
        7  => ['name' => "Scholar's Scroll",      'description' => 'Contains one hidden study tip nobody else knows.'],
        8  => ['name' => 'Focus Potion',          'description' => 'Blocks all distractions for one full study session.'],
        9  => ['name' => 'Quiz Snapshot',         'description' => 'Preview one question before a quiz even starts.'],
        10 => ['name' => 'Double Down Die',       'description' => 'Roll it for a chance to double your next XP haul.'],
        11 => ['name' => "Master's Seal",         'description' => 'A mark of true mastery — earned, never given.'],
        12 => ['name' => 'Crown of Knowledge',    'description' => 'Wear it and the whole school will know your power.'],
        13 => ['name' => 'Immortal Flame',        'description' => 'The rarest reward. Your name joins the Hall of Legends.'],
    ],
];
