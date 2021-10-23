const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const PracticeComment_On_Comment = sequelize.define("practice_comment_on_comment", {
    user_id: {
      type: Sequelize.INTEGER
    },
    practice_comment_id: {
    type: Sequelize.INTEGER
    },
   comment: {
      type: Sequelize.STRING
    },
    parent_id: {
        type: Sequelize.INTEGER
      },
  },
    {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );
//   PracticeComment_On_Comment = models => {
//    PracticeComment_On_Comment.hasMany(models.practice_likes, {
//       foreignKey: ' practice_id'
//     });
  


  return  PracticeComment_On_Comment;
};
