import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 5 },   // Ramp up to 5 users
    { duration: '2m', target: 5 },   // Stay at 5 users
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '2m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 20 },  // Ramp up to 20 users
    { duration: '2m', target: 20 },  // Stay at 20 users
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests must complete below 5s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
    errors: ['rate<0.05'],             // Custom error rate must be below 5%
    api_response_time: ['p(90)<2000'], // 90% of API calls must complete below 2s
  },
};

const BASE_URL = 'http://localhost:8000/api';
let authToken = '';

export function setup() {
  // Login and get auth token
  const loginResponse = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'test@marketscale.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

  if (loginResponse.status === 200) {
    const loginData = JSON.parse(loginResponse.body);
    return loginData.data.token;
  }
  
  return null;
}

export default function (data) {
  if (!data) {
    console.error('No auth token available');
    return;
  }

  authToken = data;
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // Randomly select a test scenario
  const scenarios = [
    'video_operations',
    'content_request_operations',
    'ai_operations',
    'analytics_operations',
    'concurrent_operations'
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  switch (scenario) {
    case 'video_operations':
      runVideoOperations(headers);
      break;
    case 'content_request_operations':
      runContentRequestOperations(headers);
      break;
    case 'ai_operations':
      runAIOperations(headers);
      break;
    case 'analytics_operations':
      runAnalyticsOperations(headers);
      break;
    case 'concurrent_operations':
      runConcurrentOperations(headers);
      break;
  }

  sleep(Math.random() * 2); // Random sleep between 0-2 seconds
}

function runVideoOperations(headers) {
  const startTime = Date.now();
  
  // Get videos list
  const videosResponse = http.get(`${BASE_URL}/videos`, { headers });
  check(videosResponse, {
    'videos list status is 200': (r) => r.status === 200,
    'videos list has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success && data.data;
      } catch (e) {
        return false;
      }
    }
  }) || errorRate.add(1);

  // Create a video
  const videoData = {
    title: `Stress Test Video ${__VU}_${Date.now()}`,
    description: 'Stress test video description',
    recording_type: 'video',
    duration: Math.floor(Math.random() * 300) + 60 // 1-6 minutes
  };

  const createResponse = http.post(`${BASE_URL}/videos`, JSON.stringify(videoData), { headers });
  check(createResponse, {
    'create video status is 201': (r) => r.status === 201,
    'create video has video data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success && data.data.id;
      } catch (e) {
        return false;
      }
    }
  }) || errorRate.add(1);

  // If video was created, get its details
  if (createResponse.status === 201) {
    const videoId = JSON.parse(createResponse.body).data.id;
    const videoResponse = http.get(`${BASE_URL}/videos/${videoId}`, { headers });
    check(videoResponse, {
      'video details status is 200': (r) => r.status === 200,
      'video details has correct ID': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.success && data.data.id === videoId;
        } catch (e) {
          return false;
        }
      }
    }) || errorRate.add(1);
  }

  const endTime = Date.now();
  apiResponseTime.add(endTime - startTime);
}

function runContentRequestOperations(headers) {
  const startTime = Date.now();
  
  // Get content requests
  const requestsResponse = http.get(`${BASE_URL}/content-requests`, { headers });
  check(requestsResponse, {
    'content requests status is 200': (r) => r.status === 200,
    'content requests has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success && data.data;
      } catch (e) {
        return false;
      }
    }
  }) || errorRate.add(1);

  // Create a content request
  const requestData = {
    title: `Stress Test Request ${__VU}_${Date.now()}`,
    description: 'Stress test content request description',
    type: 'video',
    invitees: [
      {
        email: `test${__VU}@example.com`,
        name: `Test User ${__VU}`
      }
    ]
  };

  const createResponse = http.post(`${BASE_URL}/content-requests`, JSON.stringify(requestData), { headers });
  check(createResponse, {
    'create request status is 201': (r) => r.status === 201,
    'create request has request data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success && data.data.id;
      } catch (e) {
        return false;
      }
    }
  }) || errorRate.add(1);

  const endTime = Date.now();
  apiResponseTime.add(endTime - startTime);
}

function runAIOperations(headers) {
  const startTime = Date.now();
  
  // Get videos first
  const videosResponse = http.get(`${BASE_URL}/videos`, { headers });
  if (videosResponse.status === 200) {
    const videos = JSON.parse(videosResponse.body).data.data;
    
    if (videos.length > 0) {
      const randomVideo = videos[Math.floor(Math.random() * videos.length)];
      
      // Get AI suggestions
      const aiResponse = http.get(`${BASE_URL}/videos/${randomVideo.id}/ai-suggestions`, { headers });
      check(aiResponse, {
        'AI suggestions status is 200': (r) => r.status === 200,
        'AI suggestions has data': (r) => {
          try {
            const data = JSON.parse(r.body);
            return data.success;
          } catch (e) {
            return false;
          }
        }
      }) || errorRate.add(1);
    }
  }

  const endTime = Date.now();
  apiResponseTime.add(endTime - startTime);
}

function runAnalyticsOperations(headers) {
  const startTime = Date.now();
  
  // Get videos and content requests for analytics
  const videosResponse = http.get(`${BASE_URL}/videos`, { headers });
  const requestsResponse = http.get(`${BASE_URL}/content-requests`, { headers });
  
  check(videosResponse, {
    'videos for analytics status is 200': (r) => r.status === 200
  }) || errorRate.add(1);
  
  check(requestsResponse, {
    'requests for analytics status is 200': (r) => r.status === 200
  }) || errorRate.add(1);

  // Get analytics for a specific video if available
  if (videosResponse.status === 200) {
    const videos = JSON.parse(videosResponse.body).data.data;
    if (videos.length > 0) {
      const randomVideo = videos[Math.floor(Math.random() * videos.length)];
      const analyticsResponse = http.get(`${BASE_URL}/videos/${randomVideo.id}/analytics`, { headers });
      
      check(analyticsResponse, {
        'video analytics status is 200': (r) => r.status === 200,
        'video analytics has data': (r) => {
          try {
            const data = JSON.parse(r.body);
            return data.success && data.data;
          } catch (e) {
            return false;
          }
        }
      }) || errorRate.add(1);
    }
  }

  const endTime = Date.now();
  apiResponseTime.add(endTime - startTime);
}

function runConcurrentOperations(headers) {
  const startTime = Date.now();
  
  // Run multiple operations concurrently
  const promises = [
    http.get(`${BASE_URL}/videos`, { headers }),
    http.get(`${BASE_URL}/content-requests`, { headers }),
    http.get(`${BASE_URL}/videos`, { headers }), // Duplicate to test caching
  ];

  // Wait for all requests to complete
  const responses = promises;
  
  responses.forEach((response, index) => {
    check(response, {
      [`concurrent operation ${index} status is 200`]: (r) => r.status === 200,
      [`concurrent operation ${index} has data`]: (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.success;
        } catch (e) {
          return false;
        }
      }
    }) || errorRate.add(1);
  });

  const endTime = Date.now();
  apiResponseTime.add(endTime - startTime);
}

export function teardown(data) {
  // Cleanup test data
  if (data) {
    const headers = {
      'Authorization': `Bearer ${data}`,
      'Content-Type': 'application/json'
    };

    // Clean up test videos
    const videosResponse = http.get(`${BASE_URL}/videos`, { headers });
    if (videosResponse.status === 200) {
      const videos = JSON.parse(videosResponse.body).data.data;
      videos.forEach(video => {
        if (video.title.includes('Stress Test Video') || video.title.includes('Stress Test Request')) {
          http.del(`${BASE_URL}/videos/${video.id}`, null, { headers });
        }
      });
    }

    // Clean up test content requests
    const requestsResponse = http.get(`${BASE_URL}/content-requests`, { headers });
    if (requestsResponse.status === 200) {
      const requests = JSON.parse(requestsResponse.body).data.data;
      requests.forEach(request => {
        if (request.title.includes('Stress Test Request')) {
          http.del(`${BASE_URL}/content-requests/${request.id}`, null, { headers });
        }
      });
    }
  }
}
