const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/models');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/auth/google', () => {
    it('should redirect to Google OAuth', async () => {
      const response = await request(app)
        .get('/api/auth/google');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('accounts.google.com');
    });
  });

  describe('GET /api/auth/failure', () => {
    it('should return authentication failure message', async () => {
      const response = await request(app)
        .get('/api/auth/failure');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication failed');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });
});