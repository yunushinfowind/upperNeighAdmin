const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const Practice_Comment_likes = sequelize.define("practice_comment_like", {
    user_id: {
      type: Sequelize.INTEGER,
    },
    practice_comment_id: {
    type: Sequelize.INTEGER,

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


  return Practice_Comment_likes;
};
