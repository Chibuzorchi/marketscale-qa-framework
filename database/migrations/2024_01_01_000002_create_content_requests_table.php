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
        Schema::create('content_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->enum('type', [
                'video', 
                'audio', 
                'screen_recording', 
                'testimonial', 
                'expert_quote', 
                'event_video', 
                'training_content'
            ]);
            $table->timestamp('deadline')->nullable();
            $table->enum('status', ['active', 'paused', 'completed', 'cancelled'])->default('active');
            $table->json('branding')->nullable(); // logo_url, primary_color, secondary_color
            $table->json('requirements')->nullable(); // duration_min, duration_max, quality, aspect_ratio
            $table->boolean('ai_editing_enabled')->default(true);
            $table->boolean('auto_publish')->default(false);
            $table->string('invite_token')->unique();
            $table->decimal('completion_percentage', 5, 2)->default(0);
            $table->decimal('total_budget', 10, 2)->nullable();
            $table->decimal('used_budget', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_requests');
    }
};
