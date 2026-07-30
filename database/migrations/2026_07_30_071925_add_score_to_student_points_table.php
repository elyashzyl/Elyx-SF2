<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_points', function (Blueprint $table) {
            $table->smallInteger('score')->unsigned()->nullable()->after('points');
            $table->smallInteger('total')->unsigned()->nullable()->after('score');
        });
    }

    public function down(): void
    {
        Schema::table('student_points', function (Blueprint $table) {
            $table->dropColumn(['score', 'total']);
        });
    }
};
