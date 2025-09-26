describe('Content Requests Management', () => {
  beforeEach(() => {
    cy.visit('/requests');
    cy.login('test@marketscale.com', 'password123');
  });

  describe('Content Request List', () => {
    it('should display content requests list', () => {
      cy.get('[data-cy=content-requests-list]').should('be.visible');
      cy.get('[data-cy=create-request-btn]').should('be.visible');
    });

    it('should filter content requests by status', () => {
      cy.get('[data-cy=status-filter]').select('active');
      cy.get('[data-cy=content-request-item]').should('have.attr', 'data-status', 'active');
    });

    it('should filter content requests by type', () => {
      cy.get('[data-cy=type-filter]').select('video');
      cy.get('[data-cy=content-request-item]').should('contain', 'Video Content');
    });

    it('should search content requests', () => {
      cy.get('[data-cy=search-input]').type('Product Demo');
      cy.get('[data-cy=content-request-item]').should('contain', 'Product Demo');
    });
  });

  describe('Create Content Request', () => {
    beforeEach(() => {
      cy.get('[data-cy=create-request-btn]').click();
    });

    it('should display create form', () => {
      cy.get('[data-cy=create-request-form]').should('be.visible');
      cy.get('[data-cy=request-title-input]').should('be.visible');
      cy.get('[data-cy=request-description-input]').should('be.visible');
      cy.get('[data-cy=request-type-select]').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('[data-cy=submit-request-btn]').click();
      cy.get('[data-cy=title-error]').should('contain', 'Title is required');
      cy.get('[data-cy=description-error]').should('contain', 'Description is required');
    });

    it('should create content request successfully', () => {
      // Mock successful API response
      cy.intercept('POST', '/api/content-requests', {
        statusCode: 201,
        body: {
          success: true,
          data: {
            id: 1,
            title: 'Test Request',
            status: 'active'
          }
        }
      }).as('createRequest');

      cy.get('[data-cy=request-title-input]').type('Test Request');
      cy.get('[data-cy=request-description-input]').type('Test Description');
      cy.get('[data-cy=request-type-select]').select('video');
      
      // Add invitees
      cy.get('[data-cy=add-invitee-btn]').click();
      cy.get('[data-cy=invitee-email-input]').type('test@example.com');
      cy.get('[data-cy=invitee-name-input]').type('Test User');
      
      cy.get('[data-cy=submit-request-btn]').click();

      cy.wait('@createRequest');
      cy.get('[data-cy=success-message]').should('contain', 'Content request created successfully');
    });

    it('should add multiple invitees', () => {
      cy.get('[data-cy=add-invitee-btn]').click();
      cy.get('[data-cy=invitee-email-input]').type('user1@example.com');
      cy.get('[data-cy=invitee-name-input]').type('User One');
      
      cy.get('[data-cy=add-invitee-btn]').click();
      cy.get('[data-cy=invitee-email-input]').eq(1).type('user2@example.com');
      cy.get('[data-cy=invitee-name-input]').eq(1).type('User Two');
      
      cy.get('[data-cy=invitee-item]').should('have.length', 2);
    });

    it('should remove invitees', () => {
      cy.get('[data-cy=add-invitee-btn]').click();
      cy.get('[data-cy=invitee-email-input]').type('user@example.com');
      cy.get('[data-cy=invitee-name-input]').type('User');
      
      cy.get('[data-cy=remove-invitee-btn]').click();
      cy.get('[data-cy=invitee-item]').should('have.length', 0);
    });
  });

  describe('Content Request Details', () => {
    beforeEach(() => {
      // Mock content request data
      cy.intercept('GET', '/api/content-requests/1', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 1,
            title: 'Product Demo',
            description: 'Create a product demonstration video',
            type: 'video',
            status: 'active',
            invitees: [
              { id: 1, email: 'user1@example.com', name: 'User One', status: 'pending' },
              { id: 2, email: 'user2@example.com', name: 'User Two', status: 'submitted' }
            ],
            videos: [
              { id: 1, title: 'Demo Video', status: 'ready' }
            ]
          }
        }
      }).as('getRequest');
    });

    it('should display content request details', () => {
      cy.visit('/requests/1');
      cy.wait('@getRequest');
      
      cy.get('[data-cy=request-title]').should('contain', 'Product Demo');
      cy.get('[data-cy=request-description]').should('contain', 'Create a product demonstration video');
      cy.get('[data-cy=invitees-list]').should('be.visible');
      cy.get('[data-cy=videos-list]').should('be.visible');
    });

    it('should show invitee status', () => {
      cy.visit('/requests/1');
      cy.wait('@getRequest');
      
      cy.get('[data-cy=invitee-item]').first().should('contain', 'pending');
      cy.get('[data-cy=invitee-item]').last().should('contain', 'submitted');
    });

    it('should display submitted videos', () => {
      cy.visit('/requests/1');
      cy.wait('@getRequest');
      
      cy.get('[data-cy=video-item]').should('contain', 'Demo Video');
    });
  });

  describe('Content Request Actions', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/content-requests/1', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 1,
            title: 'Test Request',
            status: 'active'
          }
        }
      }).as('getRequest');
    });

    it('should pause content request', () => {
      cy.intercept('PUT', '/api/content-requests/1', {
        statusCode: 200,
        body: { success: true, data: { status: 'paused' } }
      }).as('pauseRequest');

      cy.visit('/requests/1');
      cy.wait('@getRequest');
      
      cy.get('[data-cy=pause-request-btn]').click();
      cy.wait('@pauseRequest');
      cy.get('[data-cy=request-status]').should('contain', 'paused');
    });

    it('should complete content request', () => {
      cy.intercept('PUT', '/api/content-requests/1', {
        statusCode: 200,
        body: { success: true, data: { status: 'completed' } }
      }).as('completeRequest');

      cy.visit('/requests/1');
      cy.wait('@getRequest');
      
      cy.get('[data-cy=complete-request-btn]').click();
      cy.wait('@completeRequest');
      cy.get('[data-cy=request-status]').should('contain', 'completed');
    });

    it('should cancel content request', () => {
      cy.intercept('PUT', '/api/content-requests/1', {
        statusCode: 200,
        body: { success: true, data: { status: 'cancelled' } }
      }).as('cancelRequest');

      cy.visit('/requests/1');
      cy.wait('@getRequest');
      
      cy.get('[data-cy=cancel-request-btn]').click();
      cy.get('[data-cy=confirm-cancel-btn]').click();
      cy.wait('@cancelRequest');
      cy.get('[data-cy=request-status]').should('contain', 'cancelled');
    });
  });

  describe('Analytics Dashboard', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/content-requests/1/analytics', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            total_invitees: 5,
            submitted_videos: 3,
            completion_rate: 60,
            total_views: 150,
            average_quality_score: 8.5
          }
        }
      }).as('getAnalytics');
    });

    it('should display analytics data', () => {
      cy.visit('/requests/1/analytics');
      cy.wait('@getAnalytics');
      
      cy.get('[data-cy=total-invitees]').should('contain', '5');
      cy.get('[data-cy=submitted-videos]').should('contain', '3');
      cy.get('[data-cy=completion-rate]').should('contain', '60%');
      cy.get('[data-cy=total-views]').should('contain', '150');
      cy.get('[data-cy=avg-quality-score]').should('contain', '8.5');
    });
  });

  describe('Invite Link Functionality', () => {
    it('should access invite link', () => {
      cy.intercept('GET', '/api/content-requests/invite/test-token', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 1,
            title: 'Test Request',
            invite_token: 'test-token'
          }
        }
      }).as('getInvite');

      cy.visit('/invite/test-token');
      cy.wait('@getInvite');
      
      cy.get('[data-cy=invite-info]').should('contain', 'Test Request');
      cy.get('[data-cy=record-btn]').should('be.visible');
    });
  });
});
