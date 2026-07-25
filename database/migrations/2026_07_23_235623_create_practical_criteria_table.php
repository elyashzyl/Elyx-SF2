<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practical_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practical_id')->constrained('practicals')->cascadeOnDelete();
            $table->string('criterion_name');
            $table->text('description')->nullable();
            $table->integer('max_points')->default(10);
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practical_criteria');
    }
};
