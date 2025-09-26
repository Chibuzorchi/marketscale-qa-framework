<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\VideoController;
use App\Http\Controllers\Api\ContentRequestController;
use App\Http\Controllers\Api\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication routes
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('user', [AuthController::class, 'user'])->middleware('auth:sanctum');
});

// Public API routes
Route::get('health', function () {
    return response()->json([
        'success' => true,
        'message' => 'MarketScale API is running',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
});

// Protected API routes
Route::middleware('auth:sanctum')->group(function () {
    // Video routes
    Route::apiResource('videos', VideoController::class);
    Route::post('videos/{video}/process', [VideoController::class, 'process']);
    Route::post('videos/{video}/publish', [VideoController::class, 'publish']);
    
    // Content request routes
    Route::apiResource('content-requests', ContentRequestController::class);
    Route::post('content-requests/{request}/approve', [ContentRequestController::class, 'approve']);
    Route::post('content-requests/{request}/reject', [ContentRequestController::class, 'reject']);
});

// Fallback for undefined routes
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'API endpoint not found',
        'error' => '404 Not Found'
    ], 404);
});