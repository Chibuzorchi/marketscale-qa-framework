<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\VideoController;
use App\Http\Controllers\Api\ContentRequestController;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'service' => 'MarketScale Platform Mock'
    ]);
});

Route::apiResource('videos', VideoController::class);
Route::apiResource('content-requests', ContentRequestController::class);

Route::get('/content-requests/invite/{token}', [ContentRequestController::class, 'getByInviteToken']);
Route::post('/content-requests/{id}/submit-video', [ContentRequestController::class, 'submitVideo']);
