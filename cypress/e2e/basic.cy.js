describe('MarketScale Basic Tests', () => {
  beforeEach(() => {
    // Visit the application before each test
    cy.visit('/')
  })

  it('should load the homepage', () => {
    cy.get('body').should('be.visible')
  })

  it('should have API endpoints working', () => {
    // Test videos API
    cy.request('GET', '/api/videos').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success')
      expect(response.body.success).to.be.true
    })

    // Test content requests API
    cy.request('GET', '/api/content-requests').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success')
      expect(response.body.success).to.be.true
    })
  })

  it('should handle 404 pages gracefully', () => {
    cy.request({
      method: 'GET',
      url: '/api/nonexistent',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([404, 405])
    })
  })
})
