<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('record_id')->constrained('monthly_records')->cascadeOnDelete();
            $table->string('student_id');
            $table->string('student_name');
            $table->text('days')->nullable();
            $table->integer('present')->default(0);
            $table->integer('absent')->default(0);
            $table->integer('tardy')->default(0);
            $table->text('remarks')->nullable();
            $table->boolean('late_enrollee')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_entries');
    }
};
