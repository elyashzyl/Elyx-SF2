<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('record_id')->constrained('attendance_records')->cascadeOnDelete();
            $table->string('student_id');
            $table->string('name');
            $table->string('am1')->nullable();
            $table->string('am2')->nullable();
            $table->string('am3')->nullable();
            $table->string('am4')->nullable();
            $table->string('am5')->nullable();
            $table->string('am6')->nullable();
            $table->string('pm1')->nullable();
            $table->string('pm2')->nullable();
            $table->string('pm3')->nullable();
            $table->string('pm4')->nullable();
            $table->text('reason')->nullable();
            $table->boolean('excused')->default(false);
            $table->boolean('unexcused')->default(false);
            $table->boolean('nls')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_entries');
    }
};
