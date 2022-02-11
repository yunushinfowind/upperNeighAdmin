const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const Comment_On_Comment = sequelize.define("comment_on_comment", {
    user_id: {
      type: Sequelize.INTEGER
    },
    comment_id: {
    type: Sequelize.INTEGER
    },
   comment: {
      type: Sequelize.STRING
    },
    parent_id: {
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
  Comment_On_Comment.associate = models => {
    Comment_On_Comment.belongsTo(models.user, {
      foreignKey: 'user_id'
    });
  
  }

  return Comment_On_Comment;
};
