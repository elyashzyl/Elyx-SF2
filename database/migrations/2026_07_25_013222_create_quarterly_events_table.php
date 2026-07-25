<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quarterly_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_name');
            $table->string('first_grading')->nullable();
            $table->string('second_grading')->nullable();
            $table->string('third_grading')->nullable();
            $table->string('fourth_grading')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quarterly_events');
    }
};
