'use strict';

const { v4: uuidv4 } = require('uuid');
const { nanoid } = require('nanoid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, get the demo users
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE google_id IN (\'demo_user_1\', \'demo_user_2\', \'demo_user_3\')',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.log('No demo users found. Please run user seeds first.');
      return;
    }

    const urls = [
      // User 1 URLs
      {
        id: uuidv4(),
        user_id: users[0].id,
        long_url: 'https://www.google.com',
        short_code: nanoid(8),
        custom_alias: 'google',
        topic: 'acquisition',
        click_count: 150,
        unique_clicks: 75,
        is_active: true,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: users[0].id,
        long_url: 'https://www.github.com',
        short_code: nanoid(8),
        custom_alias: 'github',
        topic: 'activation',
        click_count: 89,
        unique_clicks: 45,
        is_active: true,
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: users[0].id,
        long_url: 'https://www.stackoverflow.com',
        short_code: nanoid(8),
        topic: 'retention',
        click_count: 234,
        unique_clicks: 120,
        is_active: true,
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        updated_at: new Date()
      },
      // User 2 URLs
      {
        id: uuidv4(),
        user_id: users[1].id,
        long_url: 'https://www.youtube.com',
        short_code: nanoid(8),
        custom_alias: 'youtube',
        topic: 'acquisition',
        click_count: 567,
        unique_clicks: 289,
        is_active: true,
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: users[1].id,
        long_url: 'https://www.linkedin.com',
        short_code: nanoid(8),
        topic: 'activation',
        click_count: 123,
        unique_clicks: 67,
        is_active: true,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updated_at: new Date()
      },
      // User 3 URLs
      {
        id: uuidv4(),
        user_id: users[2].id,
        long_url: 'https://www.twitter.com',
        short_code: nanoid(8),
        custom_alias: 'twitter',
        topic: 'retention',
        click_count: 345,
        unique_clicks: 178,
        is_active: true,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: users[2].id,
        long_url: 'https://www.facebook.com',
        short_code: nanoid(8),
        topic: 'acquisition',
        click_count: 78,
        unique_clicks: 42,
        is_active: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('urls', urls, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('urls', {
      custom_alias: ['google', 'github', 'youtube', 'twitter']
    }, {});
  }
};