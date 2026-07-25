<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_section_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_attempt_id')->constrained('exam_attempts')->cascadeOnDelete();
            $table->foreignId('exam_criterion_id')->constrained('exam_criteria')->cascadeOnDelete();
            $table->foreignId('exam_section_id')->constrained('exam_sections')->cascadeOnDelete();
            $table->integer('score')->default(0);
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['exam_attempt_id', 'exam_criterion_id'], 'exam_section_scores_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_section_scores');
    }
};
