<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('practical_attempts', function (Blueprint $table) {
            $table->text('submission_text')->nullable()->after('total_score');
            $table->string('submission_file')->nullable()->after('submission_text');
        });
    }

    public function down(): void
    {
        Schema::table('practical_attempts', function (Blueprint $table) {
            $table->dropColumn(['submission_text', 'submission_file']);
        });
    }
};
