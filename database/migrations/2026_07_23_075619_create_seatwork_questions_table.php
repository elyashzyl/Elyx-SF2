<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seatwork_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seatwork_id')->constrained('seatworks')->cascadeOnDelete();
            $table->text('question_text');
            $table->string('type'); // identification, enumeration, true_false, multiple_choice, matching
            $table->integer('points')->default(1);
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seatwork_questions');
    }
};
