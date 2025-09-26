<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\ContentRequest;
use App\Services\VideoProcessingService;
use App\Services\AiEditingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class VideoController extends Controller
{
    protected $videoProcessingService;
    protected $aiEditingService;

    public function __construct(VideoProcessingService $videoProcessingService, AiEditingService $aiEditingService)
    {
        $this->videoProcessingService = $videoProcessingService;
        $this->aiEditingService = $aiEditingService;
    }

    /**
     * Get all videos for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $videos = Video::where('user_id', auth()->id())
            ->with(['user', 'contentRequest'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $videos
        ]);
    }

    /**
     * Store a newly recorded video
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'video_file' => 'required|file|mimes:mp4,webm,mov|max:102400', // 100MB max
            'content_request_id' => 'nullable|exists:content_requests,id',
            'recording_type' => 'required|in:video,screen,audio',
            'duration' => 'required|integer|min:1',
            'thumbnail' => 'nullable|image|max:5120' // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Store video file
            $videoPath = $request->file('video_file')->store('videos', 'public');
            
            // Generate thumbnail if not provided
            $thumbnailPath = null;
            if ($request->hasFile('thumbnail')) {
                $thumbnailPath = $request->file('thumbnail')->store('thumbnails', 'public');
            } else {
                $thumbnailPath = $this->videoProcessingService->generateThumbnail($videoPath);
            }

            // Create video record
            $video = Video::create([
                'user_id' => auth()->id(),
                'title' => $request->title,
                'description' => $request->description,
                'file_path' => $videoPath,
                'thumbnail_path' => $thumbnailPath,
                'content_request_id' => $request->content_request_id,
                'recording_type' => $request->recording_type,
                'duration' => $request->duration,
                'status' => 'processing',
                'file_size' => $request->file('video_file')->getSize(),
                'mime_type' => $request->file('video_file')->getMimeType()
            ]);

            // Process video in background
            $this->videoProcessingService->processVideo($video);

            return response()->json([
                'success' => true,
                'message' => 'Video uploaded successfully',
                'data' => $video->load('user')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload video',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific video
     */
    public function show(Video $video): JsonResponse
    {
        $this->authorize('view', $video);

        return response()->json([
            'success' => true,
            'data' => $video->load(['user', 'contentRequest', 'reviews', 'aiSuggestions'])
        ]);
    }

    /**
     * Update video details
     */
    public function update(Request $request, Video $video): JsonResponse
    {
        $this->authorize('update', $video);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'status' => 'sometimes|in:draft,processing,ready,archived'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $video->update($request->only(['title', 'description', 'status']));

        return response()->json([
            'success' => true,
            'message' => 'Video updated successfully',
            'data' => $video
        ]);
    }

    /**
     * Delete a video
     */
    public function destroy(Video $video): JsonResponse
    {
        $this->authorize('delete', $video);

        try {
            // Delete files from storage
            Storage::disk('public')->delete($video->file_path);
            if ($video->thumbnail_path) {
                Storage::disk('public')->delete($video->thumbnail_path);
            }

            $video->delete();

            return response()->json([
                'success' => true,
                'message' => 'Video deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete video',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get AI editing suggestions for a video
     */
    public function getAiSuggestions(Video $video): JsonResponse
    {
        $this->authorize('view', $video);

        try {
            $suggestions = $this->aiEditingService->generateSuggestions($video);

            return response()->json([
                'success' => true,
                'data' => $suggestions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate AI suggestions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Apply AI editing suggestions
     */
    public function applyAiSuggestion(Request $request, Video $video): JsonResponse
    {
        $this->authorize('update', $video);

        $validator = Validator::make($request->all(), [
            'suggestion_id' => 'required|exists:ai_suggestions,id',
            'action' => 'required|in:apply,reject'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $result = $this->aiEditingService->applySuggestion(
                $video, 
                $request->suggestion_id, 
                $request->action
            );

            return response()->json([
                'success' => true,
                'message' => 'AI suggestion processed successfully',
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process AI suggestion',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get video analytics
     */
    public function analytics(Video $video): JsonResponse
    {
        $this->authorize('view', $video);

        $analytics = [
            'views' => $video->views_count ?? 0,
            'downloads' => $video->downloads_count ?? 0,
            'shares' => $video->shares_count ?? 0,
            'engagement_rate' => $video->engagement_rate ?? 0,
            'completion_rate' => $video->completion_rate ?? 0,
            'last_viewed_at' => $video->last_viewed_at,
            'created_at' => $video->created_at,
            'status' => $video->status
        ];

        return response()->json([
            'success' => true,
            'data' => $analytics
        ]);
    }
}
