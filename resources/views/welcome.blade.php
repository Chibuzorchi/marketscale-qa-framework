<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MarketScale Platform Mock</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <h1 class="text-3xl font-bold text-gray-900 mb-4">🎬 MarketScale Platform Mock</h1>
            <p class="text-gray-600 mb-6">B2B User-Generated Content Platform</p>
            
            <div class="space-y-4">
                <a href="/record" class="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                    Record Video
                </a>
                <a href="/library" class="block w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
                    Content Library
                </a>
                <a href="/requests" class="block w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700">
                    Content Requests
                </a>
            </div>
            
            <div class="mt-8 text-sm text-gray-500">
                <p>API Health: <a href="/api/health" class="text-blue-600 hover:underline">Check Status</a></p>
            </div>
        </div>
    </div>
</body>
</html>
