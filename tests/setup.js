require('dotenv').config({ path: '.env.test' });

process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'res';
process.env.JWT_SECRET = 'test-secret';
process.env.REDIS_URL = 'redis://default:kJPvecYjGxhNOpUzLUXhXtNRsUEevhEg@yamanote.proxy.rlwy.net:38260';

if (process.env.NODE_ENV == 'test') {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}