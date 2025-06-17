'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const users = [
      {
        id: uuidv4(),
        google_id: 'demo_user_1',
        email: 'john.doe@example.com',
        name: 'John Doe',
        avatar: 'https://via.placeholder.com/150/0000FF/808080?text=JD',
        is_active: true,
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        google_id: 'demo_user_2',
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        avatar: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=JS',
        is_active: true,
        last_login: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        google_id: 'demo_user_3',
        email: 'mike.johnson@example.com',
        name: 'Mike Johnson',
        avatar: 'https://via.placeholder.com/150/00FF00/000000?text=MJ',
        is_active: true,
        last_login: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', users, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      google_id: ['demo_user_1', 'demo_user_2', 'demo_user_3']
    }, {});
  }
};