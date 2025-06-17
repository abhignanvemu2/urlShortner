require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'url_shortener_test';
process.env.JWT_SECRET = 'test-secret';
process.env.REDIS_URL = 'redis://localhost:6379';

// Suppress console logs during testing
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}