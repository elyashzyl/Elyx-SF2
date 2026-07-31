<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->string('type')->default('flashcard')->after('xp_reward');
        });

        Schema::table('game_cards', function (Blueprint $table) {
            $table->json('options')->nullable()->after('answer');
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('type');
        });
        Schema::table('game_cards', function (Blueprint $table) {
            $table->dropColumn('options');
        });
    }
};
