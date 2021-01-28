const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const TeacherVideo = sequelize.define("teacherVideo", {
    user_id: {
      type: Sequelize.INTEGER
    },
    list_order: {
      type: Sequelize.INTEGER
    },
    video_link: {
      type: Sequelize.STRING,
      get() {
        if(this.getDataValue('video_type') == 'embed_url'){
          return (this.getDataValue('video_link')) ?  this.getDataValue('video_link') : config.HOST + '/app/controllers/images/user_default.png';
        }else{
          return (this.getDataValue('video_link')) ? config.HOST + 'uploads/artists/videos/' + this.getDataValue('video_link') : config.HOST + '/app/controllers/images/user_default.png';
        }
       
      }
    },
    video_title: {
      type: Sequelize.STRING
    },
    video_type: {
            type: Sequelize.STRING,
    },
    video_description: {
      type: Sequelize.TEXT
    },
    video_thumb: {
      type: Sequelize.STRING,
      get() {
        return (this.getDataValue('video_thumb')) ? config.HOST + 'uploads/artists/thumbs/' + this.getDataValue('video_thumb') : config.HOST + '/app/controllers/images/user_default.png';
      }
    },
    video_file_name: {
      type: Sequelize.VIRTUAL,
      get() {
          return (this.getDataValue('video_link'));
      }
  },
    duration: {
      type: Sequelize.STRING
    },
    slice_added: {
      type: Sequelize.ENUM('yes', 'no')
    },
    notation_file_added: {
      type: Sequelize.ENUM('yes', 'no')
    },
    is_saved: {
      type: Sequelize.VIRTUAL
    },

  },
    {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  TeacherVideo.associate = models => {
    TeacherVideo.belongsTo(models.user, {
      foreignKey: 'user_id'
    });
    TeacherVideo.hasOne(models.videoSlice, {
      foreignKey: 'artist_video_id'
    });

  }
  return TeacherVideo;
};
