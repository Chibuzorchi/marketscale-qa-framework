// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration for MarketScale QA Framework
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // This is useful for handling third-party library errors
  return false
})

// Set default viewport for video recording tests
Cypress.config('viewportWidth', 1280)
Cypress.config('viewportHeight', 720)

// Global test data
Cypress.env('apiBaseUrl', 'http://localhost:8000/api')
Cypress.env('appBaseUrl', 'http://localhost:8000')

// Custom commands for MarketScale specific functionality
Cypress.Commands.add('loginAsUser', (email = 'test@marketscale.com', password = 'password') => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiBaseUrl')}/auth/login`,
    body: {
      email,
      password
    }
  }).then((response) => {
    expect(response.status).to.eq(200)
    window.localStorage.setItem('auth_token', response.body.token)
  })
})

Cypress.Commands.add('createTestVideo', (videoData = {}) => {
  const defaultVideoData = {
    title: 'Test Video',
    description: 'Test video description',
    duration: 120,
    status: 'processing'
  }
  
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiBaseUrl')}/videos`,
    body: { ...defaultVideoData, ...videoData }
  })
})

Cypress.Commands.add('createTestContentRequest', (requestData = {}) => {
  const defaultRequestData = {
    title: 'Test Content Request',
    description: 'Test content request description',
    type: 'video',
    status: 'pending'
  }
  
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiBaseUrl')}/content-requests`,
    body: { ...defaultRequestData, ...requestData }
  })
})

// Custom assertions for MarketScale API responses
Cypress.Commands.add('shouldHaveValidApiResponse', (response) => {
  expect(response.status).to.be.oneOf([200, 201, 204])
  expect(response.body).to.have.property('success')
  expect(response.body.success).to.be.true
})

Cypress.Commands.add('shouldHaveVideoData', (video) => {
  expect(video).to.have.property('id')
  expect(video).to.have.property('title')
  expect(video).to.have.property('status')
  expect(video).to.have.property('created_at')
})

Cypress.Commands.add('shouldHaveContentRequestData', (request) => {
  expect(request).to.have.property('id')
  expect(request).to.have.property('title')
  expect(request).to.have.property('type')
  expect(request).to.have.property('status')
  expect(request).to.have.property('created_at')
})
