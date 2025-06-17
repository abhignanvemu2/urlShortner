
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/server');
const { sequelize, User, Url } = require('../src/models');
require('dotenv').config();

describe('URL Endpoints', () => {
  let authToken;
  let  ;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    testUser = await User.create({
      google_id: 'test123',
      email: 'test@example.com',
      name: 'Test User'
    });

    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/shorten', () => {
    it('should create a short URL successfully', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          longUrl: 'https://example.com',
          topic: 'test'
        });

      expect(response.status).toBe(201);
      expect(response.body.shortUrl).toBeDefined();
      expect(response.body.longUrl).toBe('https://example.com');
      expect(response.body.topic).toBe('test');
    });

    it('should create a short URL with custom alias', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          longUrl: 'https://example.com/test',
          customAlias: 'mytest',
          topic: 'test-topic'
        });

      expect(response.status).toBe(201);
      expect(response.body.customAlias).toBe('mytest');
      expect(response.body.shortUrl).toContain('mytest');
    });

    it('should return 400 for invalid URL', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          longUrl: 'invalid-url'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({
          longUrl: 'https://example.com'
        });

      expect(response.status).toBe(401);
    });

    it('should return 409 for duplicate custom alias', async () => {
      await request(app)
        .post('/api/shorten')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          longUrl: 'https://example.com/first',
          customAlias: 'duplicate'
        });

      const response = await request(app)
        .post('/api/shorten')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          longUrl: 'https://example.com/second',
          customAlias: 'duplicate'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Custom alias already exists');
    });
  });

  describe('GET /api/urls', () => {
    beforeAll(async () => {
      await Url.bulkCreate([
        {
          user_id: testUser.id,
          long_url: 'https://example.com/1',
          short_code: 'test001',
          topic: 'acquisition'
        },
        {
          user_id: testUser.id,
          long_url: 'https://example.com/2',
          short_code: 'test002',
          topic: 'retention'
        }
      ]);
    });

    it('should get user URLs successfully', async () => {
      const response = await request(app)
        .get('/api/urls')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.urls).toBeDefined();
      expect(Array.isArray(response.body.urls)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should filter URLs by topic', async () => {
      const response = await request(app)
        .get('/api/urls?topic=acquisition')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.urls.every(url => url.topic === 'acquisition')).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/urls');

      expect(response.status).toBe(401);
    });
  });
});
