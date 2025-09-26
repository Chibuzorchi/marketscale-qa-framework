<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentRequest;
use App\Models\Video;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContentRequestInvitation;

class ContentRequestController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get all content requests for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $query = ContentRequest::with(['creator', 'videos.user'])
            ->where('creator_id', auth()->id());

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $contentRequests = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $contentRequests
        ]);
    }

    /**
     * Create a new content request
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:2000',
            'type' => 'required|in:video,audio,screen_recording,testimonial,expert_quote,event_video,training_content',
            'deadline' => 'nullable|date|after:now',
            'invitees' => 'required|array|min:1',
            'invitees.*.email' => 'required|email',
            'invitees.*.name' => 'required|string|max:255',
            'invitees.*.role' => 'nullable|string|max:100',
            'branding' => 'nullable|array',
            'branding.logo_url' => 'nullable|url',
            'branding.primary_color' => 'nullable|string|max:7',
            'branding.secondary_color' => 'nullable|string|max:7',
            'requirements' => 'nullable|array',
            'requirements.duration_min' => 'nullable|integer|min:1',
            'requirements.duration_max' => 'nullable|integer|min:1',
            'requirements.quality' => 'nullable|in:720p,1080p,4k',
            'requirements.aspect_ratio' => 'nullable|in:16:9,9:16,1:1,4:3',
            'ai_editing_enabled' => 'boolean',
            'auto_publish' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Create content request
            $contentRequest = ContentRequest::create([
                'creator_id' => auth()->id(),
                'title' => $request->title,
                'description' => $request->description,
                'type' => $request->type,
                'deadline' => $request->deadline,
                'status' => 'active',
                'branding' => $request->branding ?? [],
                'requirements' => $request->requirements ?? [],
                'ai_editing_enabled' => $request->ai_editing_enabled ?? true,
                'auto_publish' => $request->auto_publish ?? false,
                'invite_token' => \Str::random(32)
            ]);

            // Create invitee records
            foreach ($request->invitees as $invitee) {
                $contentRequest->invitees()->create([
                    'email' => $invitee['email'],
                    'name' => $invitee['name'],
                    'role' => $invitee['role'] ?? null,
                    'status' => 'pending',
                    'invite_token' => \Str::random(32)
                ]);
            }

            // Send invitation emails
            $this->sendInvitations($contentRequest);

            return response()->json([
                'success' => true,
                'message' => 'Content request created successfully',
                'data' => $contentRequest->load(['creator', 'invitees', 'videos'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create content request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific content request
     */
    public function show(ContentRequest $contentRequest): JsonResponse
    {
        $this->authorize('view', $contentRequest);

        return response()->json([
            'success' => true,
            'data' => $contentRequest->load(['creator', 'invitees', 'videos.user', 'reviews'])
        ]);
    }

    /**
     * Update content request
     */
    public function update(Request $request, ContentRequest $contentRequest): JsonResponse
    {
        $this->authorize('update', $contentRequest);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:2000',
            'deadline' => 'nullable|date|after:now',
            'status' => 'sometimes|in:active,paused,completed,cancelled',
            'branding' => 'nullable|array',
            'requirements' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $contentRequest->update($request->only([
            'title', 'description', 'deadline', 'status', 'branding', 'requirements'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Content request updated successfully',
            'data' => $contentRequest
        ]);
    }

    /**
     * Get content request by invite token (for invitees)
     */
    public function getByInviteToken(string $token): JsonResponse
    {
        $contentRequest = ContentRequest::where('invite_token', $token)
            ->with(['creator', 'invitees', 'videos.user'])
            ->first();

        if (!$contentRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Content request not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $contentRequest
        ]);
    }

    /**
     * Submit video for content request
     */
    public function submitVideo(Request $request, ContentRequest $contentRequest): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|exists:videos,id',
            'invitee_token' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verify invitee token
        $invitee = $contentRequest->invitees()
            ->where('invite_token', $request->invitee_token)
            ->first();

        if (!$invitee) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid invitee token'
            ], 403);
        }

        try {
            $video = Video::findOrFail($request->video_id);
            $video->update([
                'content_request_id' => $contentRequest->id,
                'status' => 'submitted'
            ]);

            // Update invitee status
            $invitee->update(['status' => 'submitted']);

            // Notify creator
            $this->notificationService->notifyVideoSubmitted($contentRequest, $video, $invitee);

            return response()->json([
                'success' => true,
                'message' => 'Video submitted successfully',
                'data' => $video
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit video',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get analytics for content request
     */
    public function analytics(ContentRequest $contentRequest): JsonResponse
    {
        $this->authorize('view', $contentRequest);

        $analytics = [
            'total_invitees' => $contentRequest->invitees()->count(),
            'submitted_videos' => $contentRequest->videos()->count(),
            'pending_invitees' => $contentRequest->invitees()->where('status', 'pending')->count(),
            'submitted_invitees' => $contentRequest->invitees()->where('status', 'submitted')->count(),
            'completion_rate' => $contentRequest->invitees()->count() > 0 
                ? ($contentRequest->invitees()->where('status', 'submitted')->count() / $contentRequest->invitees()->count()) * 100 
                : 0,
            'total_views' => $contentRequest->videos()->sum('views_count'),
            'total_duration' => $contentRequest->videos()->sum('duration'),
            'average_quality_score' => $contentRequest->videos()->avg('quality_score'),
            'created_at' => $contentRequest->created_at,
            'deadline' => $contentRequest->deadline,
            'status' => $contentRequest->status
        ];

        return response()->json([
            'success' => true,
            'data' => $analytics
        ]);
    }

    /**
     * Send invitations to all invitees
     */
    private function sendInvitations(ContentRequest $contentRequest): void
    {
        foreach ($contentRequest->invitees as $invitee) {
            try {
                Mail::to($invitee->email)->send(
                    new ContentRequestInvitation($contentRequest, $invitee)
                );
            } catch (\Exception $e) {
                \Log::error("Failed to send invitation to {$invitee->email}: " . $e->getMessage());
            }
        }
    }
}
