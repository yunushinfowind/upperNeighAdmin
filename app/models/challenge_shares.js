const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const Challenge_Share = sequelize.define("challenge_shares", {
    user_id: {
      type: Sequelize.INTEGER
    },
    challenge_id: {
    type: Sequelize.INTEGER
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive')
    }
  },
    {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );
//    User_Challenge.associate = models => {
//    User_Challenge.hasMany(models.challenge_likes, {
//       foreignKey: ' challenge_id'
//     });
  


  return Challenge_Share;
};
