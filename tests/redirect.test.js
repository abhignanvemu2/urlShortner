const request = require('supertest');
const app = require('../src/server');
const { sequelize, User, Url } = require('../src/models');

describe('Redirect Endpoints', () => {
  let testUser;
  let testUrl;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Create test user
    testUser = await User.create({
      google_id: 'test123',
      email: 'test@example.com',
      name: 'Test User'
    });

    // Create test URL
    testUrl = await Url.create({
      user_id: testUser.id,
      long_url: 'https://example.com',
      short_code: 'test123'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /:alias', () => {
    it('should redirect to original URL', async () => {
      const response = await request(app)
        .get('/test123')
        .expect(302);

      expect(response.headers.location).toBe('https://example.com');
    });

    it('should return 404 for non-existent alias', async () => {
      const response = await request(app)
        .get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Short URL not found');
    });

    it('should track click analytics', async () => {
      await request(app)
        .get('/test123')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      // Check if URL click count increased
      const updatedUrl = await Url.findByPk(testUrl.id);
      expect(updatedUrl.click_count).toBe(1);
    });
  });
});