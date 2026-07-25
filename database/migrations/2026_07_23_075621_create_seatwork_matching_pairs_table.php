<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seatwork_matching_pairs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('seatwork_questions')->cascadeOnDelete();
            $table->string('left_text');
            $table->string('right_text');
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seatwork_matching_pairs');
    }
};
