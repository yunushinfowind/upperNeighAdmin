const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const Comment_likes = sequelize.define("comment_like", {
    user_id: {
      type: Sequelize.INTEGER,
    },
    comment_id: {
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


  return Comment_likes;
};
