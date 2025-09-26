// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom commands for MarketScale QA Framework

/**
 * Wait for video recording to be ready
 */
Cypress.Commands.add('waitForVideoRecordingReady', () => {
  cy.get('[data-cy="video-recorder"]', { timeout: 10000 }).should('be.visible')
  cy.get('[data-cy="record-button"]').should('be.enabled')
})

/**
 * Start video recording
 */
Cypress.Commands.add('startVideoRecording', () => {
  cy.get('[data-cy="record-button"]').click()
  cy.get('[data-cy="recording-indicator"]').should('be.visible')
  cy.get('[data-cy="stop-button"]').should('be.visible')
})

/**
 * Stop video recording
 */
Cypress.Commands.add('stopVideoRecording', () => {
  cy.get('[data-cy="stop-button"]').click()
  cy.get('[data-cy="recording-indicator"]').should('not.exist')
  cy.get('[data-cy="preview-video"]').should('be.visible')
})

/**
 * Upload test video file
 */
Cypress.Commands.add('uploadTestVideo', (fileName = 'test-video.mp4') => {
  cy.fixture(fileName).then(fileContent => {
    cy.get('[data-cy="video-upload"]').attachFile({
      fileContent: fileContent,
      fileName: fileName,
      mimeType: 'video/mp4'
    })
  })
})

/**
 * Fill content request form
 */
Cypress.Commands.add('fillContentRequestForm', (data = {}) => {
  const defaultData = {
    title: 'Test Content Request',
    description: 'Test description',
    type: 'video',
    priority: 'medium'
  }
  
  const formData = { ...defaultData, ...data }
  
  cy.get('[data-cy="request-title"]').type(formData.title)
  cy.get('[data-cy="request-description"]').type(formData.description)
  cy.get('[data-cy="request-type"]').select(formData.type)
  cy.get('[data-cy="request-priority"]').select(formData.priority)
})

/**
 * Submit content request form
 */
Cypress.Commands.add('submitContentRequestForm', () => {
  cy.get('[data-cy="submit-request"]').click()
  cy.get('[data-cy="success-message"]').should('be.visible')
})

/**
 * Navigate to video library
 */
Cypress.Commands.add('navigateToVideoLibrary', () => {
  cy.get('[data-cy="video-library-nav"]').click()
  cy.url().should('include', '/videos')
  cy.get('[data-cy="video-library"]').should('be.visible')
})

/**
 * Navigate to content requests
 */
Cypress.Commands.add('navigateToContentRequests', () => {
  cy.get('[data-cy="content-requests-nav"]').click()
  cy.url().should('include', '/content-requests')
  cy.get('[data-cy="content-requests-list"]').should('be.visible')
})

/**
 * Wait for API response
 */
Cypress.Commands.add('waitForApiResponse', (alias, timeout = 10000) => {
  cy.wait(alias, { timeout }).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201, 204])
    return cy.wrap(interception)
  })
})

/**
 * Mock video recording API
 */
Cypress.Commands.add('mockVideoRecordingApi', () => {
  cy.intercept('POST', '/api/videos', {
    statusCode: 201,
    body: {
      success: true,
      data: {
        id: 1,
        title: 'Test Video',
        status: 'processing',
        created_at: new Date().toISOString()
      }
    }
  }).as('createVideo')
  
  cy.intercept('GET', '/api/videos', {
    statusCode: 200,
    body: {
      success: true,
      data: {
        current_page: 1,
        data: [],
        total: 0
      }
    }
  }).as('getVideos')
})

/**
 * Mock content request API
 */
Cypress.Commands.add('mockContentRequestApi', () => {
  cy.intercept('POST', '/api/content-requests', {
    statusCode: 201,
    body: {
      success: true,
      data: {
        id: 1,
        title: 'Test Content Request',
        type: 'video',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    }
  }).as('createContentRequest')
  
  cy.intercept('GET', '/api/content-requests', {
    statusCode: 200,
    body: {
      success: true,
      data: {
        current_page: 1,
        data: [],
        total: 0
      }
    }
  }).as('getContentRequests')
})

/**
 * Clear all local storage
 */
Cypress.Commands.add('clearAllData', () => {
  cy.clearLocalStorage()
  cy.clearCookies()
})

/**
 * Take screenshot with custom name
 */
Cypress.Commands.add('takeNamedScreenshot', (name) => {
  cy.screenshot(name, { capture: 'fullPage' })
})

/**
 * Check for console errors
 */
Cypress.Commands.add('checkConsoleErrors', () => {
  cy.window().then((win) => {
    const errors = win.console.error
    if (errors && errors.calls && errors.calls.length > 0) {
      cy.log('Console errors found:', errors.calls)
    }
  })
})
