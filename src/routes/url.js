const express = require('express');
const { body, validationResult } = require('express-validator');
const { nanoid } = require('nanoid');
const { authenticateJWT } = require('../middleware/auth');
const { urlCreationLimiter } = require('../middleware/rateLimiter');
const { Url } = require('../models');
const { getRedisClient } = require('../config/redis');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateUrlRequest:
 *       type: object
 *       required:
 *         - longUrl
 *       properties:
 *         longUrl:
 *           type: string
 *           format: uri
 *           description: The original URL to be shortened
 *         customAlias:
 *           type: string
 *           maxLength: 50
 *           description: Custom alias for the short URL (optional)
 *         topic:
 *           type: string
 *           maxLength: 50
 *           description: Category for grouping URLs (e.g., acquisition, activation, retention)
 *     UrlResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         shortUrl:
 *           type: string
 *         longUrl:
 *           type: string
 *         shortCode:
 *           type: string
 *         customAlias:
 *           type: string
 *         topic:
 *           type: string
 *         clickCount:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/shorten:
 *   post:
 *     summary: Create a new short URL
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUrlRequest'
 *     responses:
 *       201:
 *         description: Short URL created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UrlResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Custom alias already exists
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/shorten',
  authenticateJWT,
  urlCreationLimiter,
  [
    body('longUrl')
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Please provide a valid URL with http:// or https://'),
    body('customAlias')
      .optional()
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Custom alias must be 3-50 characters long and contain only letters, numbers, underscores, and hyphens'),
    body('topic')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Topic must be 1-50 characters long')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: errors.array()
        });
      }

      const { longUrl, customAlias, topic } = req.body;
      const userId = req.user.id;

      // Check if custom alias already exists
      if (customAlias) {
        const existingUrl = await Url.findOne({
          where: { custom_alias: customAlias }
        });
        if (existingUrl) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Custom alias already exists'
          });
        }
      }

      // Generate unique short code
      let shortCode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        shortCode = nanoid(8);
        const existing = await Url.findOne({ where: { short_code: shortCode } });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Unable to generate unique short code'
        });
      }

      // Create URL record
      const url = await Url.create({
        user_id: userId,
        long_url: longUrl,
        short_code: shortCode,
        custom_alias: customAlias || null,
        topic: topic || null
      });

      // Cache the URL mapping in Redis
      const redis = getRedisClient();
      const cacheKey = customAlias || shortCode;
      await redis.setEx(`url:${cacheKey}`, 3600, longUrl); 

      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const shortUrl = `${baseUrl}/${customAlias || shortCode}`;

      res.status(201).json({
        id: url.id,
        shortUrl,
        longUrl: url.long_url,
        shortCode: url.short_code,
        customAlias: url.custom_alias,
        topic: url.topic,
        clickCount: url.click_count,
        createdAt: url.created_at
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/urls:
 *   get:
 *     summary: Get user's URLs
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: Filter URLs by topic
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of URLs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of URLs to skip
 *     responses:
 *       200:
 *         description: URLs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 urls:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UrlResponse'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 */
router.get('/urls',
  authenticateJWT,
  async (req, res, next) => {
    try {
      const { topic, limit = 20, offset = 0 } = req.query;
      const userId = req.user.id;

      const where = { user_id: userId };
      if (topic) {
        where.topic = topic;
      }

      const { count, rows: urls } = await Url.findAndCountAll({
        where,
        limit: Math.min(parseInt(limit), 100),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const formattedUrls = urls.map(url => ({
        id: url.id,
        shortUrl: `${baseUrl}/${url.custom_alias || url.short_code}`,
        longUrl: url.long_url,
        shortCode: url.short_code,
        customAlias: url.custom_alias,
        topic: url.topic,
        clickCount: url.click_count,
        uniqueClicks: url.unique_clicks,
        createdAt: url.created_at
      }));

      res.json({
        urls: formattedUrls,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/urls/{id}:
 *   delete:
 *     summary: Delete a URL
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: URL ID
 *     responses:
 *       200:
 *         description: URL deleted successfully
 *       404:
 *         description: URL not found
 *       403:
 *         description: Not authorized to delete this URL
 */
router.delete('/urls/:id',
  authenticateJWT,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const url = await Url.findOne({
        where: { id, user_id: userId }
      });

      if (!url) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'URL not found'
        });
      }

      // Remove from Redis cache
      const redis = getRedisClient();
      const cacheKey = url.custom_alias || url.short_code;
      await redis.del(`url:${cacheKey}`);

      await url.destroy();

      res.json({
        success: true,
        message: 'URL deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;