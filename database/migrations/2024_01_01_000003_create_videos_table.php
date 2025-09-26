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
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('thumbnail_path')->nullable();
            $table->foreignId('content_request_id')->nullable()->constrained('content_requests')->onDelete('set null');
            $table->enum('recording_type', ['video', 'screen', 'audio']);
            $table->integer('duration'); // in seconds
            $table->enum('status', ['draft', 'processing', 'ready', 'archived', 'submitted'])->default('processing');
            $table->bigInteger('file_size'); // in bytes
            $table->string('mime_type');
            $table->decimal('quality_score', 3, 2)->nullable(); // 0.00 to 10.00
            $table->integer('views_count')->default(0);
            $table->integer('downloads_count')->default(0);
            $table->integer('shares_count')->default(0);
            $table->decimal('engagement_rate', 5, 2)->nullable(); // percentage
            $table->decimal('completion_rate', 5, 2)->nullable(); // percentage
            $table->timestamp('last_viewed_at')->nullable();
            $table->json('metadata')->nullable(); // additional video metadata
            $table->boolean('ai_processed')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
