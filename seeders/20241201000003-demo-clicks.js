'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get demo URLs and users
    const urls = await queryInterface.sequelize.query(
      'SELECT id, user_id FROM urls LIMIT 5',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (urls.length === 0) {
      console.log('No demo URLs found. Please run URL seeds first.');
      return;
    }

    const clicks = [];
    const countries = ['US', 'CA', 'GB', 'DE', 'FR', 'JP', 'AU', 'IN'];
    const regions = ['California', 'Ontario', 'London', 'Berlin', 'Paris', 'Tokyo', 'Sydney', 'Mumbai'];
    const cities = ['San Francisco', 'Toronto', 'London', 'Berlin', 'Paris', 'Tokyo', 'Sydney', 'Mumbai'];
    const devices = ['mobile', 'desktop', 'tablet'];
    const osNames = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
    ];

    // Generate clicks for each URL over the past 7 days
    for (const url of urls) {
      const numClicks = Math.floor(Math.random() * 50) + 10; // 10-60 clicks per URL
      
      for (let i = 0; i < numClicks; i++) {
        const daysAgo = Math.floor(Math.random() * 7);
        const hoursAgo = Math.floor(Math.random() * 24);
        const minutesAgo = Math.floor(Math.random() * 60);
        
        const clickTime = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
        
        const countryIndex = Math.floor(Math.random() * countries.length);
        const deviceIndex = Math.floor(Math.random() * devices.length);
        const osIndex = Math.floor(Math.random() * osNames.length);
        const browserIndex = Math.floor(Math.random() * browsers.length);
        const userAgentIndex = Math.floor(Math.random() * userAgents.length);
        
        // Generate a somewhat realistic IP address
        const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        
        clicks.push({
          id: uuidv4(),
          url_id: url.id,
          user_id: url.user_id,
          ip_address: ip,
          user_agent: userAgents[userAgentIndex],
          referer: Math.random() > 0.5 ? 'https://www.google.com' : null,
          country: countries[countryIndex],
          region: regions[countryIndex],
          city: cities[countryIndex],
          device_type: devices[deviceIndex],
          os_name: osNames[osIndex],
          browser_name: browsers[browserIndex],
          is_unique: Math.random() > 0.3, // 70% chance of being unique
          created_at: clickTime,
          updated_at: clickTime
        });
      }
    }

    // Insert clicks in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < clicks.length; i += batchSize) {
      const batch = clicks.slice(i, i + batchSize);
      await queryInterface.bulkInsert('clicks', batch, {});
    }

    console.log(`Inserted ${clicks.length} demo clicks`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('clicks', {}, {});
  }
};