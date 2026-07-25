<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practical_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('practical_attempts')->cascadeOnDelete();
            $table->foreignId('criterion_id')->constrained('practical_criteria')->cascadeOnDelete();
            $table->integer('score')->default(0);
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practical_scores');
    }
};
