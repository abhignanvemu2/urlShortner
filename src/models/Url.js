module.exports = (sequelize, DataTypes) => {
  const Url = sequelize.define('Url', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    long_url: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    short_code: {
      type: DataTypes.STRING(10),
      unique: true,
      allowNull: false
    },
    custom_alias: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true
    },
    topic: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    click_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    unique_clicks: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'urls',
    indexes: [
      {
        unique: true,
        fields: ['short_code']
      },
      {
        unique: true,
        fields: ['custom_alias']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['topic']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['updated_at']
      }
    ]
  });

  return Url;
};