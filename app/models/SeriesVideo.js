const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
    const SeriesVideo = sequelize.define("seriesVideo", {
        user_id: {
            type: Sequelize.INTEGER,
        },
        list_order: {
            type: Sequelize.INTEGER,
        },
        series_id: {
            type: Sequelize.INTEGER,
        },
        video_title: {
            type: Sequelize.STRING,
        },
        video_type: {
            type: Sequelize.STRING,
        },
        video_description: {
            type: Sequelize.TEXT,
        },
        content_type: {
            type: Sequelize.STRING,
        },
        video_duration: {
            type: Sequelize.STRING,
        },
        video_file_name: {
            type: Sequelize.VIRTUAL,
            get() {
                return (this.getDataValue('video_link'));
            }
        },
        video_thumb: {
            type: Sequelize.STRING,
            get() {
                return (this.getDataValue('video_thumb')) ? config.HOST + 'uploads/series/thumbs/' + this.getDataValue('video_thumb') : config.HOST + '/app/controllers/images/user_default.png';
            }
        },
        video_link: {
            type: Sequelize.STRING,
            get() {
                if(this.getDataValue('video_type') == 'embed_url'){
                  return (this.getDataValue('video_link')) ?  this.getDataValue('video_link') : config.HOST + '/app/controllers/images/user_default.png';
                }else{
                  return (this.getDataValue('video_link')) ? config.HOST + 'uploads/series/videos/' + this.getDataValue('video_link') : config.HOST + '/app/controllers/images/user_default.png';
                }
               
              }
        },
        slice_added:{
            type: Sequelize.ENUM('yes', 'no'),
        },
        notation_file_added:{
            type: Sequelize.ENUM('yes', 'no'),
        }

    },
        {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    SeriesVideo.associate = models => {
        SeriesVideo.hasOne(models.videoSlice, {
            foreignKey: 'series_id'
        });
        SeriesVideo.belongsTo(models.user, {
            foreignKey: 'user_id'
        });
        SeriesVideo.belongsTo(models.series, {
            foreignKey: 'series_id'
        });
        // SeriesVideo.belongsTo(models.series, {
        //     foreignKey: 'series_id'
        // });

    }
    return SeriesVideo;
};
