<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('practicals', function (Blueprint $table) {
            $table->string('grade')->nullable()->after('title');
        });

        Schema::create('practical_grade_level', function (Blueprint $table) {
            $table->foreignId('practical_id')->constrained()->cascadeOnDelete();
            $table->foreignId('grade_level_id')->constrained()->cascadeOnDelete();
            $table->unique(['practical_id', 'grade_level_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practical_grade_level');
        Schema::table('practicals', function (Blueprint $table) {
            $table->dropColumn('grade');
        });
    }
};
