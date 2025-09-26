const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    downloadsFolder: 'cypress/downloads',
    env: {
      // Test environment variables
      API_BASE_URL: 'http://localhost:8000/api',
      TEST_USER_EMAIL: 'test@marketscale.com',
      TEST_USER_PASSWORD: 'password123',
      ADMIN_EMAIL: 'admin@marketscale.com',
      ADMIN_PASSWORD: 'admin123'
    }
  },
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite'
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  }
});
