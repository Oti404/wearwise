/**
 * tests/setup.js
 * Global setup for automated tests (Jest).
 */

// Set environment to test
process.env.NODE_ENV = 'test';

// Global mocks or cleanup
beforeAll(async () => {
  // Initialize test database or mocks here
  // Example: require('./mocks/firebase.mock');
});

afterAll(async () => {
  // Cleanup connections
});
