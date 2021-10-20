const config = require("../config/config.js");

module.exports = (sequelize,Sequelize) => {
    const Practice_Comment = sequelize.define('practice_comments',{

        user_id: {
            type: Sequelize.INTEGER
          },
          practice_id: {
          type: Sequelize.INTEGER
          },
         comment: {
            type: Sequelize.STRING
          },
          parent_id: {
              type: Sequelize.INTEGER
          },
         practice_comment_like_count: {
              type: Sequelize.VIRTUAL
          },
          practice_comment_on_comment_count: {
              type: Sequelize.VIRTUAL
          }
    },
    {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  Practice_Comment.associate = models => {
     Practice_Comment.hasMany(models.practice_comment_on_comment, {
      foreignKey: 'practice_comment_id'
      });
  
      Practice_Comment.hasMany(models.practice_comment_like, {
      foreignKey: 'practice_comment_id'
      });
 
  
    }
  return Practice_Comment;
}