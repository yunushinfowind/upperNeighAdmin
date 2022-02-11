const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const Challenge_Comment = sequelize.define("challenge_comments", {
    user_id: {
      type: Sequelize.INTEGER
    },
    challenge_id: {
    type: Sequelize.INTEGER
    },
   comment: {
      type: Sequelize.STRING
    },
    parent_id: {
        type: Sequelize.INTEGER
    },
    comment_like_count: {
        type: Sequelize.VIRTUAL
    },
    comment_on_comment_count: {
        type: Sequelize.VIRTUAL
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
   Challenge_Comment.associate = models => {
   Challenge_Comment.hasMany(models.comment_like, {
      foreignKey: 'comment_id'
    });
    Challenge_Comment.hasMany(models.comment_on_comment, {
      foreignKey: 'comment_id'
    });
    Challenge_Comment.belongsTo(models.user, {
      foreignKey: 'user_id'
    });
  }

  return Challenge_Comment;
};
