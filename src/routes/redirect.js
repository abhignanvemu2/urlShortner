const express = require('express');
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const { Url, Click } = require('../models');
const { getRedisClient } = require('../config/redis');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @swagger
 * /{alias}:
 *   get:
 *     summary: Redirect to original URL using short code or custom alias
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *         description: Short code or custom alias
 *     responses:
 *       302:
 *         description: Redirect to original URL
 *       404:
 *         description: Short URL not found
 */
router.get('/:alias', async (req, res, next) => {
  try {
    const { alias } = req.params;
    if (alias === 'favicon.ico') {
      return res.status(204).end();
    }
    const redis = getRedisClient();


    // Try to get URL from Redis cache first
    let longUrl = await redis.get(`url:${alias}`);
    let url;

    if (!longUrl) {
      url = await Url.findOne({
        where: {
          [Op.or]: [
            { short_code: alias },
            { custom_alias: alias }
          ],
          is_active: true
        }
      });

      if (!url) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Short URL not found'
        });
      }

      longUrl = url.long_url;

      await redis.setEx(`url:${alias}`, 3600, longUrl);
    } else {

      url = await Url.findOne({
        where: {
          [Op.or]: [
            { short_code: alias },
            { custom_alias: alias }
          ],
          is_active: true
        }
      });
    }

    // Parse user agent for analytics
    const userAgent = req.get('User-Agent') || '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Get IP and geolocation
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const geo = geoip.lookup(clientIp);

    // Check if this is a unique click (same IP + URL in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingClick = await Click.findOne({
      where: {
        url_id: url.id,
        ip_address: clientIp,
        created_at: {
          $gte: oneDayAgo
        }
      }
    });

    const isUnique = !existingClick;

    // Create click record for analytics
    await Click.create({
      url_id: url.id,
      user_id: url.user_id,
      ip_address: clientIp,
      user_agent: userAgent,
      referer: req.get('Referer') || null,
      country: geo?.country || null,
      region: geo?.region || null,
      city: geo?.city || null,
      device_type: result.device.type || 'desktop',
      os_name: result.os.name || 'Unknown',
      browser_name: result.browser.name || 'Unknown',
      is_unique: isUnique
    });

    // Update URL statistics
    const updateData = { click_count: url.click_count + 1 };
    if (isUnique) {
      updateData.unique_clicks = url.unique_clicks + 1;
    }

    await Url.update(updateData, {
      where: { id: url.id }
    });

    // Redirect to original URL
    res.redirect(longUrl);

  } catch (error) {
    next(error);
  }
});

module.exports = router;