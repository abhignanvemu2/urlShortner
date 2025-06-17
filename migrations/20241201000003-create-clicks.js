'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clicks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      url_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'urls',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      ip_address: {
        type: Sequelize.INET,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      referer: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      region: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      device_type: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      os_name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      browser_name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      is_unique: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.addIndex('clicks', ['url_id'], {
      name: 'clicks_url_id_index'
    });

    await queryInterface.addIndex('clicks', ['user_id'], {
      name: 'clicks_user_id_index'
    });

    await queryInterface.addIndex('clicks', ['created_at'], {
      name: 'clicks_created_at_index'
    });
   
    await queryInterface.addIndex('clicks', ['updated_at'], {
      name: 'clicks_updated_at_index'
    });

    await queryInterface.addIndex('clicks', ['ip_address', 'url_id'], {
      name: 'clicks_ip_url_index'
    });

    await queryInterface.addIndex('clicks', ['is_unique'], {
      name: 'clicks_is_unique_index'
    });

    await queryInterface.addIndex('clicks', ['country'], {
      name: 'clicks_country_index'
    });

    await queryInterface.addIndex('clicks', ['device_type'], {
      name: 'clicks_device_type_index'
    });

    await queryInterface.addIndex('clicks', ['os_name'], {
      name: 'clicks_os_name_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('clicks');
  }
};