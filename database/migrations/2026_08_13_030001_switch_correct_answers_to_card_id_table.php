<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_correct_answers', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'game_id', 'card_index']);
            $table->unsignedBigInteger('card_id')->nullable()->after('game_id');
            $table->unique(['user_id', 'game_id', 'card_id']);
        });
    }

    public function down(): void
    {
        Schema::table('game_correct_answers', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'game_id', 'card_id']);
            $table->dropColumn('card_id');
            $table->unique(['user_id', 'game_id', 'card_index']);
        });
    }
};