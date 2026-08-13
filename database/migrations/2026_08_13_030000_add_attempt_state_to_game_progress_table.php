<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_progress', function (Blueprint $table) {
            $table->text('card_order')->nullable()->after('completed');
            $table->text('graded')->nullable()->after('card_order');
        });
    }

    public function down(): void
    {
        Schema::table('game_progress', function (Blueprint $table) {
            $table->dropColumn(['card_order', 'graded']);
        });
    }
};