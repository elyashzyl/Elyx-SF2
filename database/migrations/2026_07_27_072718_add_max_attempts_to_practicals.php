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
        Schema::table('practicals', function (Blueprint $table) {
            $table->integer('max_attempts')->default(3)->after('is_published');
        });
    }

    public function down(): void
    {
        Schema::table('practicals', function (Blueprint $table) {
            $table->dropColumn('max_attempts');
        });
    }
};
