<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seatwork_grade_level', function (Blueprint $table) {
            $table->foreignId('seatwork_id')->constrained()->cascadeOnDelete();
            $table->foreignId('grade_level_id')->constrained()->cascadeOnDelete();
            $table->unique(['seatwork_id', 'grade_level_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seatwork_grade_level');
    }
};
