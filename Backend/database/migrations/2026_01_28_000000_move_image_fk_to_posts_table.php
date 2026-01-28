<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Posts passa a apontar para imagens (imagem_id)
        Schema::table('posts', function (Blueprint $table) {
            if (!Schema::hasColumn('posts', 'imagem_id')) {
                $table->foreignId('imagem_id')
                    ->nullable()
                    ->after('publicacao')
                    ->constrained('imagens')
                    ->nullOnDelete();
            }
        });

        // 2) Imagens deixa de apontar para posts (remove post_id e FK)
        Schema::table('imagens', function (Blueprint $table) {
            if (Schema::hasColumn('imagens', 'post_id')) {
                try {
                    $table->dropForeign(['post_id']);
                } catch (\Throwable $e) {
                    // ignora se a FK não existir (varia por ambiente)
                }
                $table->dropColumn('post_id');
            }
        });
    }

    public function down(): void
    {
        // Recria post_id em imagens
        Schema::table('imagens', function (Blueprint $table) {
            if (!Schema::hasColumn('imagens', 'post_id')) {
                $table->foreignId('post_id')
                    ->nullable()
                    ->after('imagem')
                    ->constrained('posts')
                    ->onDelete('cascade');
            }
        });

        // Remove imagem_id de posts
        Schema::table('posts', function (Blueprint $table) {
            if (Schema::hasColumn('posts', 'imagem_id')) {
                try {
                    $table->dropForeign(['imagem_id']);
                } catch (\Throwable $e) {
                    // ignora
                }
                $table->dropColumn('imagem_id');
            }
        });
    }
};

