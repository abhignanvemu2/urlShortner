module.exports = (sequelize, DataTypes) => {
  const Click = sequelize.define('Click', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    url_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'urls',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    referer: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    region: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    device_type: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    os_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    browser_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    is_unique: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at:{
      type: DataTypes.DATE,
      default: Date.now()
    },
    updated_at:{
      type: DataTypes.DATE,
      default: Date.now()
    },
  }, {
    tableName: 'clicks',
    indexes: [
      {
        fields: ['url_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['ip_address', 'url_id']
      },
      {
        fields: ['is_unique']
      },
      {
        fields: ['updated_at']
      }
    ]
  });

  return Click;
};