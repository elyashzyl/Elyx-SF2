<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seatwork_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('seatwork_attempts')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('seatwork_questions')->cascadeOnDelete();
            $table->text('answer_text')->nullable();
            $table->foreignId('selected_option_id')->nullable()->constrained('seatwork_options')->nullOnDelete();
            $table->json('matching_answers')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seatwork_answers');
    }
};
