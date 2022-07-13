const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const Series = sequelize.define("series", {
    user_id: {
      type: Sequelize.INTEGER,
    },
    series_name: {
      type: Sequelize.STRING,
    },
    image: {
      type: Sequelize.STRING,
      get() {
        return (this.getDataValue('image')) ? config.HOST + 'uploads/series/images/' + this.getDataValue('image') : config.HOST + '/app/controllers/images/user_default.png';
      }
    },
    series_description: {
      type: Sequelize.STRING,
    },  
    series_level: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive'),
    },
    total_duration: {
      type: Sequelize.VIRTUAL
    },
    total_duration_inMint: {
      type: Sequelize.VIRTUAL
    },
    is_saved: {
      type: Sequelize.VIRTUAL
    },
    video_count: {
      type: Sequelize.VIRTUAL
    },
    content_type: {
      type: Sequelize.STRING
    }
  },
    {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  Series.associate = models => {
    Series.hasOne(models.routineFolder, {
      foreignKey: 'series_id'
    });
    Series.belongsTo(models.user, {
      foreignKey: 'user_id'
    });
    Series.hasMany(models.seriesVideo, {
      foreignKey: 'series_id'
    });
  }


  return Series;
};
