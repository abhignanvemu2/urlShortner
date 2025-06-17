'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('urls', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      long_url: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      short_code: {
        type: Sequelize.STRING(10),
        unique: true,
        allowNull: false
      },
      custom_alias: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: true
      },
      topic: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      click_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      unique_clicks: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('urls', ['short_code'], {
      unique: true,
      name: 'urls_short_code_unique'
    });

    await queryInterface.addIndex('urls', ['custom_alias'], {
      unique: true,
      name: 'urls_custom_alias_unique'
    });

    await queryInterface.addIndex('urls', ['user_id'], {
      name: 'urls_user_id_index'
    });

    await queryInterface.addIndex('urls', ['topic'], {
      name: 'urls_topic_index'
    });

    await queryInterface.addIndex('urls', ['created_at'], {
      name: 'urls_created_at_index'
    });

    await queryInterface.addIndex('urls', ['is_active'], {
      name: 'urls_is_active_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('urls');
  }
};