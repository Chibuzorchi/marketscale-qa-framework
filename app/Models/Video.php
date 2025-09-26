<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Storage;

class Video extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'file_path',
        'thumbnail_path',
        'content_request_id',
        'recording_type',
        'duration',
        'status',
        'file_size',
        'mime_type',
        'quality_score',
        'views_count',
        'downloads_count',
        'shares_count',
        'engagement_rate',
        'completion_rate',
        'last_viewed_at',
        'metadata',
        'ai_processed',
        'published_at'
    ];

    protected $casts = [
        'metadata' => 'array',
        'ai_processed' => 'boolean',
        'published_at' => 'datetime',
        'last_viewed_at' => 'datetime',
        'file_size' => 'integer',
        'duration' => 'integer',
        'quality_score' => 'decimal:2',
        'engagement_rate' => 'decimal:2',
        'completion_rate' => 'decimal:2',
        'views_count' => 'integer',
        'downloads_count' => 'integer',
        'shares_count' => 'integer'
    ];

    /**
     * Get the user who created the video
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the content request this video belongs to
     */
    public function contentRequest(): BelongsTo
    {
        return $this->belongsTo(ContentRequest::class);
    }

    /**
     * Get all reviews for this video
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(VideoReview::class);
    }

    /**
     * Get AI suggestions for this video
     */
    public function aiSuggestions(): HasMany
    {
        return $this->hasMany(AiSuggestion::class);
    }

    /**
     * Get all comments for this video
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    /**
     * Get the video URL
     */
    public function getVideoUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->file_path);
    }

    /**
     * Get the thumbnail URL
     */
    public function getThumbnailUrlAttribute(): ?string
    {
        if (!$this->thumbnail_path) {
            return null;
        }
        return Storage::disk('public')->url($this->thumbnail_path);
    }

    /**
     * Get formatted file size
     */
    public function getFormattedFileSizeAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Get formatted duration
     */
    public function getFormattedDurationAttribute(): string
    {
        $hours = floor($this->duration / 3600);
        $minutes = floor(($this->duration % 3600) / 60);
        $seconds = $this->duration % 60;

        if ($hours > 0) {
            return sprintf('%d:%02d:%02d', $hours, $minutes, $seconds);
        }
        
        return sprintf('%d:%02d', $minutes, $seconds);
    }

    /**
     * Check if video is ready for viewing
     */
    public function isReady(): bool
    {
        return $this->status === 'ready';
    }

    /**
     * Check if video is processing
     */
    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    /**
     * Check if video is published
     */
    public function isPublished(): bool
    {
        return $this->status === 'ready' && $this->published_at !== null;
    }

    /**
     * Get recording type display name
     */
    public function getRecordingTypeDisplayAttribute(): string
    {
        return match($this->recording_type) {
            'video' => 'Video Recording',
            'screen' => 'Screen Recording',
            'audio' => 'Audio Recording',
            default => 'Unknown'
        };
    }

    /**
     * Get status display name
     */
    public function getStatusDisplayAttribute(): string
    {
        return match($this->status) {
            'draft' => 'Draft',
            'processing' => 'Processing',
            'ready' => 'Ready',
            'archived' => 'Archived',
            'submitted' => 'Submitted',
            default => 'Unknown'
        };
    }

    /**
     * Scope for published videos
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'ready')
                    ->whereNotNull('published_at');
    }

    /**
     * Scope for videos by recording type
     */
    public function scopeByRecordingType($query, string $type)
    {
        return $query->where('recording_type', $type);
    }

    /**
     * Scope for videos by user
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for videos in content request
     */
    public function scopeInContentRequest($query, int $contentRequestId)
    {
        return $query->where('content_request_id', $contentRequestId);
    }

    /**
     * Increment view count
     */
    public function incrementViews(): void
    {
        $this->increment('views_count');
        $this->update(['last_viewed_at' => now()]);
    }

    /**
     * Increment download count
     */
    public function incrementDownloads(): void
    {
        $this->increment('downloads_count');
    }

    /**
     * Increment share count
     */
    public function incrementShares(): void
    {
        $this->increment('shares_count');
    }

    /**
     * Update engagement metrics
     */
    public function updateEngagementMetrics(float $engagementRate, float $completionRate): void
    {
        $this->update([
            'engagement_rate' => $engagementRate,
            'completion_rate' => $completionRate
        ]);
    }

    /**
     * Publish the video
     */
    public function publish(): void
    {
        $this->update([
            'status' => 'ready',
            'published_at' => now()
        ]);
    }

    /**
     * Archive the video
     */
    public function archive(): void
    {
        $this->update(['status' => 'archived']);
    }
}
