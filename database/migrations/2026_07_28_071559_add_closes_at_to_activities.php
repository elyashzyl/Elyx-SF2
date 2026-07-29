<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['quizzes', 'seatworks', 'exams', 'practicals'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->timestamp('closes_at')->nullable()->after('is_published');
            });
        }
    }

    public function down(): void
    {
        foreach (['quizzes', 'seatworks', 'exams', 'practicals'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('closes_at');
            });
        }
    }
};
