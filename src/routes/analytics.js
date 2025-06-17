const express = require('express');
const { Op } = require('sequelize');
const moment = require('moment');
const { authenticateJWT } = require('../middleware/auth');
const { analyticsLimiter } = require('../middleware/rateLimiter');
const { Url, Click } = require('../models');
const { getRedisClient } = require('../config/redis');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ClicksByDate:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *         clicks:
 *           type: integer
 *     OSStats:
 *       type: object
 *       properties:
 *         osName:
 *           type: string
 *         uniqueClicks:
 *           type: integer
 *         uniqueUsers:
 *           type: integer
 *     DeviceStats:
 *       type: object
 *       properties:
 *         deviceName:
 *           type: string
 *         uniqueClicks:
 *           type: integer
 *         uniqueUsers:
 *           type: integer
 */

/**
 * @swagger
 * /api/analytics/{alias}:
 *   get:
 *     summary: Get analytics for a specific short URL
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *         description: Short code or custom alias
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClicks:
 *                   type: integer
 *                 uniqueUsers:
 *                   type: integer
 *                 clicksByDate:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClicksByDate'
 *                 osType:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OSStats'
 *                 deviceType:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeviceStats'
 */
router.get('/:alias',
  authenticateJWT,
  analyticsLimiter,
  async (req, res, next) => {
    try {
      const { alias } = req.params;
      const userId = req.user.id;

      // Find the URL
      const url = await Url.findOne({
        where: {
          [Op.or]: [
            { short_code: alias },
            { custom_alias: alias }
          ],
          user_id: userId
        }
      });

      if (!url) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'URL not found'
        });
      }

      const redis = getRedisClient();
      const cacheKey = `analytics:${url.id}`;
      
      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const sevenDaysAgo = moment().subtract(7, 'days').startOf('day').toDate();

      // Get clicks for the last 7 days
      const clicks = await Click.findAll({
        where: {
          url_id: url.id,
          created_at: {
            [Op.gte]: sevenDaysAgo
          }
        },
        order: [['created_at', 'ASC']]
      });

      // Calculate total clicks and unique users
      const totalClicks = url.click_count;
      const uniqueUsers = url.unique_clicks;

      // Group clicks by date
      const clicksByDate = [];
      for (let i = 6; i >= 0; i--) {
        const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
        const dayClicks = clicks.filter(click => 
          moment(click.created_at).format('YYYY-MM-DD') === date
        ).length;
        
        clicksByDate.push({
          date,
          clicks: dayClicks
        });
      }

      // Group by OS
      const osStats = {};
      const deviceStats = {};

      clicks.forEach(click => {
        // OS statistics
        const osName = click.os_name || 'Unknown';
        if (!osStats[osName]) {
          osStats[osName] = {
            uniqueClicks: 0,
            uniqueUsers: new Set()
          };
        }
        osStats[osName].uniqueClicks++;
        osStats[osName].uniqueUsers.add(click.ip_address);

        // Device statistics
        const deviceName = click.device_type || 'desktop';
        if (!deviceStats[deviceName]) {
          deviceStats[deviceName] = {
            uniqueClicks: 0,
            uniqueUsers: new Set()
          };
        }
        deviceStats[deviceName].uniqueClicks++;
        deviceStats[deviceName].uniqueUsers.add(click.ip_address);
      });

      // Format OS stats
      const osType = Object.entries(osStats).map(([osName, stats]) => ({
        osName,
        uniqueClicks: stats.uniqueClicks,
        uniqueUsers: stats.uniqueUsers.size
      }));

      // Format device stats
      const deviceType = Object.entries(deviceStats).map(([deviceName, stats]) => ({
        deviceName,
        uniqueClicks: stats.uniqueClicks,
        uniqueUsers: stats.uniqueUsers.size
      }));

      const analyticsData = {
        totalClicks,
        uniqueUsers,
        clicksByDate,
        osType,
        deviceType
      };

      // Cache the result for 5 minutes
      await redis.setEx(cacheKey, 300, JSON.stringify(analyticsData));

      res.json(analyticsData);

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/analytics/topic/{topic}:
 *   get:
 *     summary: Get analytics for all URLs under a specific topic
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic name
 *     responses:
 *       200:
 *         description: Topic analytics retrieved successfully
 */
router.get('/topic/:topic',
  authenticateJWT,
  analyticsLimiter,
  async (req, res, next) => {
    try {
      const { topic } = req.params;
      const userId = req.user.id;

      const redis = getRedisClient();
      const cacheKey = `topic_analytics:${userId}:${topic}`;
      
      // Try to get from cache first
      // const cached = await redis.get(cacheKey);
      // if (cached) {
      //   return res.json(JSON.parse(cached));
      // }
      
      // Get all URLs for this topic
      const urls = await Url.findAll({
        where: {
          user_id: userId,
          topic: topic
        }
      });

      if (urls.length === 0) {
        return res.json({
          totalClicks: 0,
          uniqueUsers: 0,
          clicksByDate: [],
          urls: []
        });
      }

      const urlIds = urls.map(url => url.id);
      const sevenDaysAgo = moment().subtract(7, 'days').startOf('day').toDate();

      // Get clicks for all URLs in this topic
      const clicks = await Click.findAll({
        where: {
          url_id: {
            [Op.in]: urlIds
          },
          created_at: {
            [Op.gte]: sevenDaysAgo
          }
        },
        order: [['created_at', 'ASC']]
      });

      // Calculate totals
      const totalClicks = urls.reduce((sum, url) => sum + url.click_count, 0);
      const uniqueUsers = urls.reduce((sum, url) => sum + url.unique_clicks, 0);

      // Group clicks by date
      const clicksByDate = [];
      for (let i = 6; i >= 0; i--) {
        const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
        const dayClicks = clicks.filter(click => 
          moment(click.created_at).format('YYYY-MM-DD') === date
        ).length;
        
        clicksByDate.push({
          date,
          clicks: dayClicks
        });
      }

      // Format URLs data
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const urlsData = urls.map(url => ({
        shortUrl: `${baseUrl}/${url.custom_alias || url.short_code}`,
        totalClicks: url.click_count,
        uniqueUsers: url.unique_clicks
      }));

      const analyticsData = {
        totalClicks,
        uniqueUsers,
        clicksByDate,
        urls: urlsData
      };

      // Cache the result for 5 minutes
      await redis.setEx(cacheKey, 300, JSON.stringify(analyticsData));

      res.json(analyticsData);

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/analytics/overall:
 *   get:
 *     summary: Get overall analytics for all user's URLs
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overall analytics retrieved successfully
 */
router.get('/urls/overall',
  authenticateJWT,
  analyticsLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;

      const redis = getRedisClient();
      const cacheKey = `overall_analytics:${userId}`;
      
      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }


      // Get all URLs for this user
      const urls = await Url.findAll({
        where: { user_id: userId }
      });

      const totalUrls = urls.length;
      const totalClicks = urls.reduce((sum, url) => sum + url.click_count, 0);
      const uniqueUsers = urls.reduce((sum, url) => sum + url.unique_clicks, 0);

      if (urls.length === 0) {
        return res.json({
          totalUrls: 0,
          totalClicks: 0,
          uniqueUsers: 0,
          clicksByDate: [],
          osType: [],
          deviceType: []
        });
      }

      const urlIds = urls.map(url => url.id);
      const sevenDaysAgo = moment().subtract(7, 'days').startOf('day').toDate();

      // Get all clicks for user's URLs
      const clicks = await Click.findAll({
        where: {
          url_id: {
            [Op.in]: urlIds
          },
          created_at: {
            [Op.gte]: sevenDaysAgo
          }
        },
        order: [['created_at', 'ASC']]
      });

      // Group clicks by date
      const clicksByDate = [];
      for (let i = 6; i >= 0; i--) {
        const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
        const dayClicks = clicks.filter(click => 
          moment(click.created_at).format('YYYY-MM-DD') === date
        ).length;
        
        clicksByDate.push({
          date,
          clicks: dayClicks
        });
      }

      // Group by OS and Device
      const osStats = {};
      const deviceStats = {};

      clicks.forEach(click => {
        // OS statistics
        const osName = click.os_name || 'Unknown';
        if (!osStats[osName]) {
          osStats[osName] = {
            uniqueClicks: 0,
            uniqueUsers: new Set()
          };
        }
        osStats[osName].uniqueClicks++;
        osStats[osName].uniqueUsers.add(click.ip_address);

        // Device statistics
        const deviceName = click.device_type || 'desktop';
        if (!deviceStats[deviceName]) {
          deviceStats[deviceName] = {
            uniqueClicks: 0,
            uniqueUsers: new Set()
          };
        }
        deviceStats[deviceName].uniqueClicks++;
        deviceStats[deviceName].uniqueUsers.add(click.ip_address);
      });

      // Format stats
      const osType = Object.entries(osStats).map(([osName, stats]) => ({
        osName,
        uniqueClicks: stats.uniqueClicks,
        uniqueUsers: stats.uniqueUsers.size
      }));

      const deviceType = Object.entries(deviceStats).map(([deviceName, stats]) => ({
        deviceName,
        uniqueClicks: stats.uniqueClicks,
        uniqueUsers: stats.uniqueUsers.size
      }));

      const analyticsData = {
        totalUrls,
        totalClicks,
        uniqueUsers,
        clicksByDate,
        osType,
        deviceType
      };

      // Cache the result for 5 minutes
      await redis.setEx(cacheKey, 300, JSON.stringify(analyticsData));

      res.json(analyticsData);

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;