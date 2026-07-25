<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('section_id')->nullable()->after('teacher_id')->constrained()->nullOnDelete();
            $table->dropColumn('section');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('section')->nullable()->after('grade');
            $table->dropForeign(['section_id']);
            $table->dropColumn('section_id');
        });
    }
};
