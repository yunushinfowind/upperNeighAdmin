const config = require('../config/config.js');
module.exports = (sequelize,Sequelize) => {
    const SeriesVideos = sequelize.define("series_videos",{
        series_id : {
            type : Sequelize.INTEGER
        },
        user_id : {
            type : Sequelize.INTEGER
        },
        title : {
            type : Sequelize.STRING
        },
        video_duration : {
            type : Sequelize.STRING
        },
        video_description : {
            type : Sequelize.STRING
        },
        video_thumb: {
            type: Sequelize.STRING,
            get() {
                return (this.getDataValue('video_thumb')) ? config.HOST + 'uploads/series/thumbs/' + this.getDataValue('video_thumb') : config.HOST + '/app/controllers/images/user_default.png';
            }
        }
    },
    {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
    SeriesVideos.associate = models => {
        // SeriesVideos.hasOne(models.series, {
        //   foreignKey: 'series_id'
        // });
        SeriesVideos.belongsTo(models.user, {
          foreignKey: 'user_id'
        });
    }
    return SeriesVideos;
}