const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
    const RoutineVideo = sequelize.define("routineVideo", {
        user_id: {
            type: Sequelize.INTEGER,
        },
        list_order: {
            type: Sequelize.INTEGER,
        },
        routine_id: {
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
                return (this.getDataValue('video_thumb')) ? config.HOST + 'uploads/routines/thumbs/' + this.getDataValue('video_thumb') : config.HOST + '/app/controllers/images/user_default.png';
            }
        },
        video_link: {
            type: Sequelize.STRING,
            get() {
                if(this.getDataValue('video_type') == 'embed_url'){
                  return (this.getDataValue('video_link')) ?  this.getDataValue('video_link') : config.HOST + '/app/controllers/images/user_default.png';
                }else{
                  return (this.getDataValue('video_link')) ? config.HOST + 'uploads/routines/videos/' + this.getDataValue('video_link') : config.HOST + '/app/controllers/images/user_default.png';
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

    RoutineVideo.associate = models => {
        RoutineVideo.hasOne(models.videoSlice, {
            foreignKey: 'video_id'
        });
        RoutineVideo.belongsTo(models.user, {
            foreignKey: 'user_id'
        });
        RoutineVideo.belongsTo(models.routine, {
            foreignKey: 'routine_id'
        });
        RoutineVideo.belongsTo(models.routine, {
            foreignKey: 'routine_id'
        });

    }
    return RoutineVideo;
};
