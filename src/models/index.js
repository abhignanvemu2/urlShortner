const { Sequelize } = require('sequelize');
const config = require('../config/database')[process.env.NODE_ENV ];

const sequelize = new Sequelize({
  username: config.username,
  password: config.password,
  database: config.database,
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  pool: config.pool,
  define: config.define,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
}
);

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Url = require('./Url')(sequelize, Sequelize.DataTypes);
const Click = require('./Click')(sequelize, Sequelize.DataTypes);

// Define associations
User.hasMany(Url, { foreignKey: 'user_id', as: 'urls' });
Url.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Url.hasMany(Click, { foreignKey: 'url_id', as: 'clicks' });
Click.belongsTo(Url, { foreignKey: 'url_id', as: 'url' });

User.hasMany(Click, { foreignKey: 'user_id', as: 'clicks' });
Click.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Url,
  Click
};