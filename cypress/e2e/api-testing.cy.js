describe('API Testing', () => {
  const API_BASE = 'http://localhost:8000/api';
  let authToken;

  before(() => {
    // Login and get auth token
    cy.request({
      method: 'POST',
      url: `${API_BASE}/auth/login`,
      body: {
        email: 'test@marketscale.com',
        password: 'password123'
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      authToken = response.body.data.token;
    });
  });

  describe('Authentication API', () => {
    it('should login successfully', () => {
      cy.request({
        method: 'POST',
        url: `${API_BASE}/auth/login`,
        body: {
          email: 'test@marketscale.com',
          password: 'password123'
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('token');
        expect(response.body.data).to.have.property('user');
      });
    });

    it('should reject invalid credentials', () => {
      cy.request({
        method: 'POST',
        url: `${API_BASE}/auth/login`,
        body: {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body.success).to.be.false;
      });
    });

    it('should register new user', () => {
      cy.request({
        method: 'POST',
        url: `${API_BASE}/auth/register`,
        body: {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          password_confirmation: 'password123'
        }
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('user');
      });
    });
  });

  describe('Videos API', () => {
    it('should get videos list', () => {
      cy.request({
        method: 'GET',
        url: `${API_BASE}/videos`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('data');
        expect(response.body.data).to.have.property('current_page');
      });
    });

    it('should create new video', () => {
      const videoData = {
        title: 'Test Video',
        description: 'Test Description',
        recording_type: 'video',
        duration: 120
      };

      cy.request({
        method: 'POST',
        url: `${API_BASE}/videos`,
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: videoData
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.success).to.be.true;
        expect(response.body.data.title).to.eq('Test Video');
      });
    });

    it('should get video details', () => {
      cy.request({
        method: 'GET',
        url: `${API_BASE}/videos/1`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('id');
        expect(response.body.data).to.have.property('title');
      });
    });

    it('should update video', () => {
      const updateData = {
        title: 'Updated Video Title',
        description: 'Updated Description'
      };

      cy.request({
        method: 'PUT',
        url: `${API_BASE}/videos/1`,
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: updateData
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data.title).to.eq('Updated Video Title');
      });
    });

    it('should delete video', () => {
      cy.request({
        method: 'DELETE',
        url: `${API_BASE}/videos/1`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
      });
    });

    it('should get video analytics', () => {
      cy.request({
        method: 'GET',
        url: `${API_BASE}/videos/1/analytics`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('views');
        expect(response.body.data).to.have.property('downloads');
        expect(response.body.data).to.have.property('shares');
      });
    });
  });

  describe('Content Requests API', () => {
    it('should get content requests list', () => {
      cy.request({
        method: 'GET',
        url: `${API_BASE}/content-requests`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('data');
      });
    });

    it('should create content request', () => {
      const requestData = {
        title: 'Test Content Request',
        description: 'Test Description',
        type: 'video',
        invitees: [
          {
            email: 'user1@example.com',
            name: 'User One'
          }
        ]
      };

      cy.request({
        method: 'POST',
        url: `${API_BASE}/content-requests`,
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: requestData
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.success).to.be.true;
        expect(response.body.data.title).to.eq('Test Content Request');
      });
    });

    it('should get content request by invite token', () => {
      cy.request({
        method: 'GET',
        url: `${API_BASE}/content-requests/invite/test-token`
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('invite_token', 'test-token');
      });
    });

    it('should submit video for content request', () => {
      const submitData = {
        video_id: 1,
        invitee_token: 'test-invitee-token'
      };

      cy.request({
        method: 'POST',
        url: `${API_BASE}/content-requests/1/submit-video`,
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: submitData
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
      });
    });
  });

  describe('AI Features API', () => {
    it('should get AI suggestions for video', () => {
      cy.request({
        method: 'GET',
        url: `${API_BASE}/videos/1/ai-suggestions`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');
      });
    });

    it('should apply AI suggestion', () => {
      const suggestionData = {
        suggestion_id: 1,
        action: 'apply'
      };

      cy.request({
        method: 'POST',
        url: `${API_BASE}/videos/1/apply-ai-suggestion`,
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: suggestionData
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', () => {
      cy.request({
        method: 'GET',
        url: `${API_BASE}/videos/999999`,
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.success).to.be.false;
      });
    });

    it('should handle 401 unauthorized', () => {
      cy.request({
        method: 'GET',
        url: `${API_BASE}/videos`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body.success).to.be.false;
      });
    });

    it('should handle 422 validation errors', () => {
      cy.request({
        method: 'POST',
        url: `${API_BASE}/videos`,
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: {
          // Missing required fields
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(422);
        expect(response.body.success).to.be.false;
        expect(response.body.errors).to.be.an('object');
      });
    });
  });

  describe('Performance Testing', () => {
    it('should respond within acceptable time', () => {
      const startTime = Date.now();
      
      cy.request({
        method: 'GET',
        url: `${API_BASE}/videos`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }).then((response) => {
        const responseTime = Date.now() - startTime;
        expect(responseTime).to.be.lessThan(1000); // Should respond within 1 second
        expect(response.status).to.eq(200);
      });
    });

    it('should handle concurrent requests', () => {
      const requests = [];
      
      for (let i = 0; i < 10; i++) {
        requests.push(
          cy.request({
            method: 'GET',
            url: `${API_BASE}/videos`,
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          })
        );
      }
      
      cy.wrap(Promise.all(requests)).then((responses) => {
        responses.forEach((response) => {
          expect(response.status).to.eq(200);
        });
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate video data structure', () => {
      cy.request({
        method: 'GET',
        url: `${API_BASE}/videos/1`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }).then((response) => {
        const video = response.body.data;
        
        expect(video).to.have.property('id');
        expect(video).to.have.property('title');
        expect(video).to.have.property('description');
        expect(video).to.have.property('file_path');
        expect(video).to.have.property('recording_type');
        expect(video).to.have.property('duration');
        expect(video).to.have.property('status');
        expect(video).to.have.property('created_at');
        expect(video).to.have.property('updated_at');
        
        expect(video.recording_type).to.be.oneOf(['video', 'screen', 'audio']);
        expect(video.status).to.be.oneOf(['draft', 'processing', 'ready', 'archived', 'submitted']);
        expect(video.duration).to.be.a('number');
        expect(video.duration).to.be.greaterThan(0);
      });
    });

    it('should validate content request data structure', () => {
      cy.request({
        method: 'GET',
        url: `${API_BASE}/content-requests/1`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }).then((response) => {
        const request = response.body.data;
        
        expect(request).to.have.property('id');
        expect(request).to.have.property('title');
        expect(request).to.have.property('description');
        expect(request).to.have.property('type');
        expect(request).to.have.property('status');
        expect(request).to.have.property('invite_token');
        expect(request).to.have.property('created_at');
        expect(request).to.have.property('updated_at');
        
        expect(request.type).to.be.oneOf([
          'video', 'audio', 'screen_recording', 'testimonial', 
          'expert_quote', 'event_video', 'training_content'
        ]);
        expect(request.status).to.be.oneOf(['active', 'paused', 'completed', 'cancelled']);
      });
    });
  });
});
