const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const User_challenge = sequelize.define("user_chalenges", {
    user_id: {
      type: Sequelize.INTEGER,
    },
   thumb: {
    type: Sequelize.STRING,
    // get() {
    //   return (this.getDataValue('video_thumb')) ? config.HOST + 'uploads/artists/thumbs/' + this.getDataValue('video_thumb') : config.HOST + '/app/controllers/images/user_default.png';
    },
    vedio_name: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive'),
    }
  },
    {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  // User_Challenge.associate = models => {
  // User_Challenge.belongsTo(models.users, {
  //    foreignKey: 'user_id'
  //  });
//  }


  return User_challenge;
};
