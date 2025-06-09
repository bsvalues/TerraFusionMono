# Cypress E2E Testing Setup for TerraFusion

This guide describes how to set up Cypress for end-to-end testing of the TerraFusion UI components, particularly the Valuation Wizard.

## Installation

In your UI package directory (e.g., `packages/ui`), run:

```bash
npm install --save-dev cypress @cypress/testing-library @cypress/code-coverage
npx cypress open   # This will generate the cypress/ folder structure
```

## Directory Structure

After installation, you should have this structure:

```
packages/ui/
 ├─ cypress/
 │   ├─ fixtures/
 │   ├─ integration/
 │   │   └─ valuation-wizard.spec.ts
 │   ├─ plugins/
 │   └─ support/
 └─ cypress.json
```

## Example E2E Test for Valuation Wizard

Create a file at `cypress/integration/valuation-wizard.spec.ts`:

```typescript
describe('Valuation Wizard Flow', () => {
  beforeEach(() => {
    cy.visit('/wizard');
  });

  it('lets me search for a parcel, select comps, run valuation, and see results', () => {
    // Step 1: Search parcel
    cy.get('input[placeholder="Enter address"]').type('123 Main St');
    cy.contains('Search').click();
    cy.contains('123 Main St').click();

    // Step 2: Auto-suggest comps
    cy.get('input[type="checkbox"]').should('have.length.greaterThan', 0);
    cy.get('input[type="checkbox"]').first().check();

    // Step 3: Preview weightings
    cy.contains('Next').click();
    cy.get('input[type="number"]').first().should('exist');

    // Step 4: Run valuation
    cy.contains('Next').click();
    cy.contains('Run Valuation').click();

    // Step 5: Review
    cy.contains('Estimated Value').should('exist');
    cy.contains('Confidence').should('exist');
  });
});
```

## Code Coverage Configuration

### 1. Configure Cypress Plugins for Coverage

In `cypress/plugins/index.js`:

```javascript
module.exports = (on, config) => {
  require('@cypress/code-coverage/task')(on, config);
  return config;
};
```

### 2. Add Support for Coverage

In `cypress/support/index.js`:

```javascript
import '@cypress/code-coverage/support';
```

### 3. Update Package.json

Add the following scripts to your `packages/ui/package.json`:

```json
"scripts": {
  "cy:open": "cypress open",
  "cy:run": "cypress run",
  "coverage:ci": "nyc npm test && nyc report --reporter=text-lcov | coveralls"
}
```

### 4. Create Coverage Threshold Configuration

Create `.nycrc` in your project root:

```json
{
  "all": true,
  "check-coverage": true,
  "branches": 80,
  "lines": 80,
  "functions": 80,
  "statements": 80
}
```

## Running Tests Locally

```bash
# Open Cypress UI for interactive testing
npm run cy:open

# Run Cypress tests headlessly (CI mode)
npm run cy:run

# Generate and report coverage
npm run coverage:ci
```

## Next Steps

After setting up Cypress, integrate it into your CI/CD pipeline by updating the GitHub Actions workflow file.