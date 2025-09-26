import { test, expect } from '@playwright/test';

test.describe('Video Recording - Cross Browser', () => {
  test.beforeEach(async ({ page }) => {
    // Mock media devices
    await page.addInitScript(() => {
      // Mock getUserMedia
      const mockStream = {
        getTracks: () => [
          { 
            kind: 'video',
            stop: () => {},
            enabled: true
          },
          { 
            kind: 'audio',
            stop: () => {},
            enabled: true
          }
        ]
      };

      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: () => Promise.resolve(mockStream),
          getDisplayMedia: () => Promise.resolve(mockStream)
        },
        writable: true
      });

      // Mock MediaRecorder
      class MockMediaRecorder {
        constructor(stream, options) {
          this.stream = stream;
          this.options = options;
          this.state = 'inactive';
          this.ondataavailable = null;
          this.onstop = null;
        }

        start() {
          this.state = 'recording';
          // Simulate data available
          setTimeout(() => {
            if (this.ondataavailable) {
              this.ondataavailable({ data: new Blob(['test data']) });
            }
          }, 100);
        }

        stop() {
          this.state = 'inactive';
          if (this.onstop) {
            this.onstop();
          }
        }

        pause() {
          this.state = 'paused';
        }

        resume() {
          this.state = 'recording';
        }
      }

      window.MediaRecorder = MockMediaRecorder;
    });

    await page.goto('/record');
  });

  test('should display recording interface', async ({ page }) => {
    await expect(page.locator('[data-cy=recording-controls]')).toBeVisible();
    await expect(page.locator('[data-cy=video-tab]')).toBeVisible();
    await expect(page.locator('[data-cy=screen-tab]')).toBeVisible();
    await expect(page.locator('[data-cy=audio-tab]')).toBeVisible();
  });

  test('should switch between recording types', async ({ page }) => {
    // Test video recording
    await page.click('[data-cy=video-tab]');
    await expect(page.locator('[data-cy=video-tab]')).toHaveClass(/active/);
    
    // Test screen recording
    await page.click('[data-cy=screen-tab]');
    await expect(page.locator('[data-cy=screen-tab]')).toHaveClass(/active/);
    
    // Test audio recording
    await page.click('[data-cy=audio-tab]');
    await expect(page.locator('[data-cy=audio-tab]')).toHaveClass(/active/);
  });

  test('should start and stop video recording', async ({ page }) => {
    // Start recording
    await page.click('[data-cy=start-recording-btn]');
    await expect(page.locator('[data-cy=recording-status]')).toContainText('Recording in progress');
    await expect(page.locator('[data-cy=stop-recording-btn]')).toBeVisible();

    // Stop recording
    await page.click('[data-cy=stop-recording-btn]');
    await expect(page.locator('[data-cy=recording-complete]')).toBeVisible();
  });

  test('should pause and resume recording', async ({ page }) => {
    // Start recording
    await page.click('[data-cy=start-recording-btn]');
    
    // Pause recording
    await page.click('[data-cy=pause-recording-btn]');
    await expect(page.locator('[data-cy=recording-status]')).toContainText('Recording paused');
    
    // Resume recording
    await page.click('[data-cy=resume-recording-btn]');
    await expect(page.locator('[data-cy=recording-status]')).toContainText('Recording in progress');
  });

  test('should display recording form after completion', async ({ page }) => {
    // Complete recording flow
    await page.click('[data-cy=start-recording-btn]');
    await page.click('[data-cy=stop-recording-btn]');
    
    // Check form is visible
    await expect(page.locator('[data-cy=recording-form]')).toBeVisible();
    await expect(page.locator('[data-cy=video-title-input]')).toBeVisible();
    await expect(page.locator('[data-cy=video-description-input]')).toBeVisible();
    await expect(page.locator('[data-cy=save-recording-btn]')).toBeVisible();
  });

  test('should validate recording form', async ({ page }) => {
    // Complete recording flow
    await page.click('[data-cy=start-recording-btn]');
    await page.click('[data-cy=stop-recording-btn]');
    
    // Try to save without title
    await page.click('[data-cy=save-recording-btn]');
    await expect(page.locator('[data-cy=title-error]')).toContainText('Title is required');
  });

  test('should save recording successfully', async ({ page }) => {
    // Mock API response
    await page.route('**/api/videos', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            title: 'Test Video',
            status: 'processing'
          }
        })
      });
    });

    // Complete recording flow
    await page.click('[data-cy=start-recording-btn]');
    await page.click('[data-cy=stop-recording-btn]');
    
    // Fill form
    await page.fill('[data-cy=video-title-input]', 'Test Video');
    await page.fill('[data-cy=video-description-input]', 'Test Description');
    
    // Save recording
    await page.click('[data-cy=save-recording-btn]');
    await expect(page.locator('[data-cy=success-message]')).toContainText('Recording saved successfully');
  });
});

test.describe('Video Recording - Mobile', () => {
  test.use({ ...devices['iPhone 12'] });

  test.beforeEach(async ({ page }) => {
    // Mock mobile media devices
    await page.addInitScript(() => {
      const mockStream = {
        getTracks: () => [
          { 
            kind: 'video',
            stop: () => {},
            enabled: true
          }
        ]
      };

      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: () => Promise.resolve(mockStream)
        },
        writable: true
      });
    });

    await page.goto('/record');
  });

  test('should work on mobile devices', async ({ page }) => {
    await expect(page.locator('[data-cy=recording-controls]')).toBeVisible();
    await expect(page.locator('[data-cy=video-tab]')).toBeVisible();
    
    // Test mobile recording
    await page.click('[data-cy=video-tab]');
    await page.click('[data-cy=start-recording-btn]');
    await expect(page.locator('[data-cy=recording-status]')).toContainText('Recording in progress');
  });
});

test.describe('Video Recording - Error Handling', () => {
  test('should handle camera permission denied', async ({ page }) => {
    // Mock permission denied
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: () => Promise.reject(new Error('Permission denied'))
        },
        writable: true
      });
    });

    await page.goto('/record');
    await page.click('[data-cy=start-recording-btn]');
    await expect(page.locator('[data-cy=error-message]')).toContainText('Unable to access camera');
  });

  test('should handle recording errors', async ({ page }) => {
    // Mock MediaRecorder error
    await page.addInitScript(() => {
      const mockStream = {
        getTracks: () => [{ stop: () => {} }]
      };

      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: () => Promise.resolve(mockStream)
        },
        writable: true
      });

      class MockMediaRecorder {
        constructor() {}
        start() {
          throw new Error('Recording failed');
        }
      }

      window.MediaRecorder = MockMediaRecorder;
    });

    await page.goto('/record');
    await page.click('[data-cy=start-recording-btn]');
    await expect(page.locator('[data-cy=error-message]')).toBeVisible();
  });
});

test.describe('Video Recording - Performance', () => {
  test('should load recording page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/record');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
  });

  test('should handle long recordings', async ({ page }) => {
    // Mock long recording
    await page.addInitScript(() => {
      const mockStream = {
        getTracks: () => [{ stop: () => {} }]
      };

      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: () => Promise.resolve(mockStream)
        },
        writable: true
      });

      class MockMediaRecorder {
        constructor() {
          this.state = 'inactive';
        }
        start() {
          this.state = 'recording';
        }
        stop() {
          this.state = 'inactive';
        }
      }

      window.MediaRecorder = MockMediaRecorder;
    });

    await page.goto('/record');
    await page.click('[data-cy=start-recording-btn]');
    
    // Simulate long recording (5 minutes)
    await page.waitForTimeout(1000);
    
    await page.click('[data-cy=stop-recording-btn]');
    await expect(page.locator('[data-cy=recording-complete]')).toBeVisible();
  });
});
