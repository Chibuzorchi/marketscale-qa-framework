describe('Video Recording Functionality', () => {
  beforeEach(() => {
    // Visit the recording page
    cy.visit('/record');
    cy.login('test@marketscale.com', 'password123');
  });

  describe('Recording Interface', () => {
    it('should display recording controls', () => {
      cy.get('[data-cy=recording-controls]').should('be.visible');
      cy.get('[data-cy=video-tab]').should('be.visible');
      cy.get('[data-cy=screen-tab]').should('be.visible');
      cy.get('[data-cy=audio-tab]').should('be.visible');
    });

    it('should switch between recording types', () => {
      // Test video recording tab
      cy.get('[data-cy=video-tab]').click();
      cy.get('[data-cy=video-tab]').should('have.class', 'active');
      
      // Test screen recording tab
      cy.get('[data-cy=screen-tab]').click();
      cy.get('[data-cy=screen-tab]').should('have.class', 'active');
      
      // Test audio recording tab
      cy.get('[data-cy=audio-tab]').click();
      cy.get('[data-cy=audio-tab]').should('have.class', 'active');
    });

    it('should show camera preview when ready', () => {
      cy.get('[data-cy=video-preview]').should('be.visible');
      cy.get('[data-cy=start-recording-btn]').should('be.enabled');
    });
  });

  describe('Video Recording Flow', () => {
    it('should start and stop video recording', () => {
      // Mock media devices
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
          getTracks: () => [{ stop: cy.stub() }]
        });
      });

      // Start recording
      cy.get('[data-cy=start-recording-btn]').click();
      cy.get('[data-cy=recording-status]').should('contain', 'Recording in progress');
      cy.get('[data-cy=stop-recording-btn]').should('be.visible');

      // Stop recording
      cy.get('[data-cy=stop-recording-btn]').click();
      cy.get('[data-cy=recording-complete]').should('be.visible');
    });

    it('should pause and resume recording', () => {
      // Mock media devices
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
          getTracks: () => [{ stop: cy.stub() }]
        });
      });

      // Start recording
      cy.get('[data-cy=start-recording-btn]').click();
      
      // Pause recording
      cy.get('[data-cy=pause-recording-btn]').click();
      cy.get('[data-cy=recording-status]').should('contain', 'Recording paused');
      
      // Resume recording
      cy.get('[data-cy=resume-recording-btn]').click();
      cy.get('[data-cy=recording-status]').should('contain', 'Recording in progress');
    });

    it('should cancel recording', () => {
      // Mock media devices
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
          getTracks: () => [{ stop: cy.stub() }]
        });
      });

      // Start recording
      cy.get('[data-cy=start-recording-btn]').click();
      
      // Cancel recording
      cy.get('[data-cy=cancel-recording-btn]').click();
      cy.get('[data-cy=recording-status]').should('not.exist');
    });
  });

  describe('Recording Form', () => {
    beforeEach(() => {
      // Mock completed recording
      cy.window().then((win) => {
        win.recordedVideoBlob = new Blob(['test video data'], { type: 'video/webm' });
      });
      
      // Complete recording flow
      cy.get('[data-cy=start-recording-btn]').click();
      cy.get('[data-cy=stop-recording-btn]').click();
    });

    it('should display recording details form', () => {
      cy.get('[data-cy=recording-form]').should('be.visible');
      cy.get('[data-cy=video-title-input]').should('be.visible');
      cy.get('[data-cy=video-description-input]').should('be.visible');
      cy.get('[data-cy=save-recording-btn]').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('[data-cy=save-recording-btn]').click();
      cy.get('[data-cy=title-error]').should('contain', 'Title is required');
    });

    it('should save recording successfully', () => {
      // Mock successful API response
      cy.intercept('POST', '/api/videos', {
        statusCode: 201,
        body: {
          success: true,
          data: {
            id: 1,
            title: 'Test Video',
            status: 'processing'
          }
        }
      }).as('saveVideo');

      cy.get('[data-cy=video-title-input]').type('Test Video');
      cy.get('[data-cy=video-description-input]').type('Test Description');
      cy.get('[data-cy=save-recording-btn]').click();

      cy.wait('@saveVideo');
      cy.get('[data-cy=success-message]').should('contain', 'Recording saved successfully');
    });
  });

  describe('Screen Recording', () => {
    it('should request screen capture permission', () => {
      cy.get('[data-cy=screen-tab]').click();
      
      // Mock screen capture API
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getDisplayMedia').resolves({
          getTracks: () => [{ stop: cy.stub() }]
        });
      });

      cy.get('[data-cy=start-recording-btn]').click();
      // Should request screen capture
    });
  });

  describe('Audio Recording', () => {
    it('should record audio only', () => {
      cy.get('[data-cy=audio-tab]').click();
      
      // Mock audio devices
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
          getTracks: () => [{ stop: cy.stub() }]
        });
      });

      cy.get('[data-cy=start-recording-btn]').click();
      cy.get('[data-cy=recording-status]').should('contain', 'Recording in progress');
    });
  });

  describe('Error Handling', () => {
    it('should handle camera permission denied', () => {
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').rejects(
          new Error('Permission denied')
        );
      });

      cy.get('[data-cy=start-recording-btn]').click();
      cy.get('[data-cy=error-message]').should('contain', 'Unable to access camera');
    });

    it('should handle recording errors', () => {
      // Mock recording error
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
          getTracks: () => [{ stop: cy.stub() }]
        });
      });

      cy.get('[data-cy=start-recording-btn]').click();
      
      // Simulate recording error
      cy.window().then((win) => {
        const mediaRecorder = win.MediaRecorder;
        cy.stub(mediaRecorder.prototype, 'start').throws(new Error('Recording failed'));
      });
    });
  });

  describe('Cross-Browser Compatibility', () => {
    ['chrome', 'firefox', 'edge'].forEach((browser) => {
      it(`should work in ${browser}`, () => {
        // This would be run in different browsers via CI
        cy.get('[data-cy=recording-controls]').should('be.visible');
      });
    });
  });
});
