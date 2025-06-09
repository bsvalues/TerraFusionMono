// cypress/plugins/index.js

/// <reference types="cypress" />

/**
 * This function is called when a project is opened or re-opened (e.g. due to
 * the project's config changing)
 *
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // Enable code coverage collection
  require('@cypress/code-coverage/task')(on, config);

  // Configure TypeScript processing for .ts files
  if (config.testingType === 'component') {
    require('@cypress/react/plugins/react-scripts')(on, config);
  }

  // Add additional plugin configuration here if needed
  on('task', {
    log(message) {
      console.log(message);
      return null;
    },
    table(message) {
      console.table(message);
      return null;
    }
  });

  return config;
}