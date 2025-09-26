<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return response()->json([
        'success' => true,
        'message' => 'Welcome to MarketScale Platform Mock',
        'version' => '1.0.0',
        'endpoints' => [
            'api' => '/api',
            'health' => '/api/health',
            'auth' => '/api/auth',
            'videos' => '/api/videos',
            'content-requests' => '/api/content-requests'
        ],
        'documentation' => 'https://github.com/Chibuzorchi/marketscale-qa-framework'
    ]);
});

Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'MarketScale Platform is healthy',
        'timestamp' => now(),
        'status' => 'operational'
    ]);
});