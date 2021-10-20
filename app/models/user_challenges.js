const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const User_Challenge = sequelize.define("user_challenges", {
    user_id: {
      type: Sequelize.INTEGER
    },
   thumb: {
    type: Sequelize.STRING
    // get() {
    //   return (this.getDataValue('video_thumb')) ? config.HOST + 'uploads/artists/thumbs/' + this.getDataValue('video_thumb') : config.HOST + '/app/controllers/images/user_default.png';
    },
    vedio_name: {
      type: Sequelize.STRING
    },
    like_count: {
      type: Sequelize.VIRTUAL
    },
    comment_count: {
      type: Sequelize.VIRTUAL
    },
    share_video_count: {
      type: Sequelize.VIRTUAL
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive')
    },
    is_like: {
      type: Sequelize.VIRTUAL
    }
  },
   {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
   User_Challenge.associate = models => {
   User_Challenge.hasMany(models.challenge_likes, {
      foreignKey: 'challenge_id'
    });
    User_Challenge.hasMany(models.challenge_comments, {
      foreignKey: 'challenge_id'
    });
    User_Challenge.hasMany(models.challenge_shares, {
      foreignKey: 'challenge_id'
    });
    User_Challenge.belongsTo(models.user, {
      foreignKey: 'user_id'
    });
   }

  return User_Challenge;
};
