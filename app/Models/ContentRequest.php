<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class ContentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_id',
        'title',
        'description',
        'type',
        'deadline',
        'status',
        'branding',
        'requirements',
        'ai_editing_enabled',
        'auto_publish',
        'invite_token',
        'completion_percentage',
        'total_budget',
        'used_budget'
    ];

    protected $casts = [
        'branding' => 'array',
        'requirements' => 'array',
        'ai_editing_enabled' => 'boolean',
        'auto_publish' => 'boolean',
        'deadline' => 'datetime',
        'completion_percentage' => 'decimal:2',
        'total_budget' => 'decimal:2',
        'used_budget' => 'decimal:2'
    ];

    /**
     * Get the user who created this content request
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Get all invitees for this content request
     */
    public function invitees(): HasMany
    {
        return $this->hasMany(ContentRequestInvitee::class);
    }

    /**
     * Get all videos submitted for this content request
     */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    /**
     * Get all reviews for this content request
     */
    public function reviews(): HasManyThrough
    {
        return $this->hasManyThrough(VideoReview::class, Video::class);
    }

    /**
     * Get content request by invite token
     */
    public static function findByInviteToken(string $token): ?self
    {
        return static::where('invite_token', $token)->first();
    }

    /**
     * Get type display name
     */
    public function getTypeDisplayAttribute(): string
    {
        return match($this->type) {
            'video' => 'Video Content',
            'audio' => 'Audio/Podcast',
            'screen_recording' => 'Screen Recording',
            'testimonial' => 'Customer Testimonial',
            'expert_quote' => 'Expert Quote',
            'event_video' => 'Event Video',
            'training_content' => 'Training Content',
            default => 'Unknown'
        };
    }

    /**
     * Get status display name
     */
    public function getStatusDisplayAttribute(): string
    {
        return match($this->status) {
            'active' => 'Active',
            'paused' => 'Paused',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
            default => 'Unknown'
        };
    }

    /**
     * Check if content request is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if content request is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if content request is overdue
     */
    public function isOverdue(): bool
    {
        return $this->deadline && $this->deadline->isPast() && !$this->isCompleted();
    }

    /**
     * Get completion percentage
     */
    public function getCompletionPercentage(): float
    {
        $totalInvitees = $this->invitees()->count();
        if ($totalInvitees === 0) {
            return 0;
        }

        $submittedCount = $this->invitees()->where('status', 'submitted')->count();
        return ($submittedCount / $totalInvitees) * 100;
    }

    /**
     * Update completion percentage
     */
    public function updateCompletionPercentage(): void
    {
        $this->update([
            'completion_percentage' => $this->getCompletionPercentage()
        ]);
    }

    /**
     * Get total videos count
     */
    public function getTotalVideosCount(): int
    {
        return $this->videos()->count();
    }

    /**
     * Get submitted videos count
     */
    public function getSubmittedVideosCount(): int
    {
        return $this->videos()->where('status', 'submitted')->count();
    }

    /**
     * Get pending invitees count
     */
    public function getPendingInviteesCount(): int
    {
        return $this->invitees()->where('status', 'pending')->count();
    }

    /**
     * Get submitted invitees count
     */
    public function getSubmittedInviteesCount(): int
    {
        return $this->invitees()->where('status', 'submitted')->count();
    }

    /**
     * Get average video quality score
     */
    public function getAverageQualityScore(): ?float
    {
        return $this->videos()->avg('quality_score');
    }

    /**
     * Get total video duration
     */
    public function getTotalDuration(): int
    {
        return $this->videos()->sum('duration');
    }

    /**
     * Get formatted total duration
     */
    public function getFormattedTotalDuration(): string
    {
        $totalSeconds = $this->getTotalDuration();
        $hours = floor($totalSeconds / 3600);
        $minutes = floor(($totalSeconds % 3600) / 60);
        $seconds = $totalSeconds % 60;

        if ($hours > 0) {
            return sprintf('%d hours, %d minutes', $hours, $minutes);
        }
        
        return sprintf('%d minutes, %d seconds', $minutes, $seconds);
    }

    /**
     * Scope for active content requests
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for completed content requests
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for overdue content requests
     */
    public function scopeOverdue($query)
    {
        return $query->where('deadline', '<', now())
                    ->where('status', '!=', 'completed');
    }

    /**
     * Scope for content requests by type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope for content requests by creator
     */
    public function scopeByCreator($query, int $creatorId)
    {
        return $query->where('creator_id', $creatorId);
    }

    /**
     * Mark as completed
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'completion_percentage' => 100
        ]);
    }

    /**
     * Pause the content request
     */
    public function pause(): void
    {
        $this->update(['status' => 'paused']);
    }

    /**
     * Resume the content request
     */
    public function resume(): void
    {
        $this->update(['status' => 'active']);
    }

    /**
     * Cancel the content request
     */
    public function cancel(): void
    {
        $this->update(['status' => 'cancelled']);
    }

    /**
     * Get invitee by email
     */
    public function getInviteeByEmail(string $email): ?ContentRequestInvitee
    {
        return $this->invitees()->where('email', $email)->first();
    }

    /**
     * Get invitee by token
     */
    public function getInviteeByToken(string $token): ?ContentRequestInvitee
    {
        return $this->invitees()->where('invite_token', $token)->first();
    }
}
