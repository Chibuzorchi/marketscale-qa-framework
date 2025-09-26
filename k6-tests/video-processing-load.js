import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    errors: ['rate<0.1'],              // Custom error rate must be below 10%
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

  // Test 1: Get videos list
  const videosResponse = http.get(`${BASE_URL}/videos`, { headers });
  check(videosResponse, {
    'videos list status is 200': (r) => r.status === 200,
    'videos list response time < 1000ms': (r) => r.timings.duration < 1000,
    'videos list has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success && data.data;
      } catch (e) {
        return false;
      }
    }
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Create a video (simulate upload)
  const videoData = {
    title: `Load Test Video ${__VU}`,
    description: 'Load test video description',
    recording_type: 'video',
    duration: 120
  };

  const createVideoResponse = http.post(`${BASE_URL}/videos`, JSON.stringify(videoData), { headers });
  check(createVideoResponse, {
    'create video status is 201': (r) => r.status === 201,
    'create video response time < 2000ms': (r) => r.timings.duration < 2000,
    'create video has video data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success && data.data.id;
      } catch (e) {
        return false;
      }
    }
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Get video details
  if (createVideoResponse.status === 201) {
    const videoId = JSON.parse(createVideoResponse.body).data.id;
    const videoResponse = http.get(`${BASE_URL}/videos/${videoId}`, { headers });
    check(videoResponse, {
      'video details status is 200': (r) => r.status === 200,
      'video details response time < 500ms': (r) => r.timings.duration < 500,
      'video details has video data': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.success && data.data.id === videoId;
        } catch (e) {
          return false;
        }
      }
    }) || errorRate.add(1);
  }

  sleep(1);

  // Test 4: Get content requests
  const requestsResponse = http.get(`${BASE_URL}/content-requests`, { headers });
  check(requestsResponse, {
    'content requests status is 200': (r) => r.status === 200,
    'content requests response time < 1000ms': (r) => r.timings.duration < 1000,
    'content requests has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success && data.data;
      } catch (e) {
        return false;
      }
    }
  }) || errorRate.add(1);

  sleep(1);

  // Test 5: Create content request
  const requestData = {
    title: `Load Test Request ${__VU}`,
    description: 'Load test content request',
    type: 'video',
    invitees: [
      {
        email: `test${__VU}@example.com`,
        name: `Test User ${__VU}`
      }
    ]
  };

  const createRequestResponse = http.post(`${BASE_URL}/content-requests`, JSON.stringify(requestData), { headers });
  check(createRequestResponse, {
    'create request status is 201': (r) => r.status === 201,
    'create request response time < 2000ms': (r) => r.timings.duration < 2000,
    'create request has request data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success && data.data.id;
      } catch (e) {
        return false;
      }
    }
  }) || errorRate.add(1);

  sleep(1);

  // Test 6: AI suggestions (if video exists)
  if (createVideoResponse.status === 201) {
    const videoId = JSON.parse(createVideoResponse.body).data.id;
    const aiResponse = http.get(`${BASE_URL}/videos/${videoId}/ai-suggestions`, { headers });
    check(aiResponse, {
      'AI suggestions status is 200': (r) => r.status === 200,
      'AI suggestions response time < 3000ms': (r) => r.timings.duration < 3000,
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

  sleep(1);
}

export function teardown(data) {
  // Cleanup: Delete test data if needed
  if (data) {
    const headers = {
      'Authorization': `Bearer ${data}`,
      'Content-Type': 'application/json'
    };

    // Get videos and delete test ones
    const videosResponse = http.get(`${BASE_URL}/videos`, { headers });
    if (videosResponse.status === 200) {
      const videos = JSON.parse(videosResponse.body).data.data;
      videos.forEach(video => {
        if (video.title.includes('Load Test Video')) {
          http.del(`${BASE_URL}/videos/${video.id}`, null, { headers });
        }
      });
    }

    // Get content requests and delete test ones
    const requestsResponse = http.get(`${BASE_URL}/content-requests`, { headers });
    if (requestsResponse.status === 200) {
      const requests = JSON.parse(requestsResponse.body).data.data;
      requests.forEach(request => {
        if (request.title.includes('Load Test Request')) {
          http.del(`${BASE_URL}/content-requests/${request.id}`, null, { headers });
        }
      });
    }
  }
}
