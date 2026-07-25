<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_teacher', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['student_id', 'teacher_id']);
        });

        DB::statement("INSERT INTO student_teacher (student_id, teacher_id, created_at, updated_at) SELECT id, teacher_id, datetime('now'), datetime('now') FROM users WHERE teacher_id IS NOT NULL");
    }

    public function down(): void
    {
        Schema::dropIfExists('student_teacher');
    }
};
