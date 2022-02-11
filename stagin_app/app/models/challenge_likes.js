const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const Challenge_likes = sequelize.define("challenge_likes", {
    user_id: {
      type: Sequelize.INTEGER,
    },
    challenge_id: {
    type: Sequelize.INTEGER,

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


  return Challenge_likes;
};
