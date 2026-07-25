<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seatwork_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seatwork_id')->constrained('seatworks')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('in_progress'); // in_progress, submitted
            $table->integer('score')->nullable();
            $table->integer('total_points')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seatwork_attempts');
    }
};
