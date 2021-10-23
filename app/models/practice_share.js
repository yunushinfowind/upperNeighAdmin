const config = require("../config/config.js");

module.exports = (sequelize,Sequelize) => {
    const Practice_Share = sequelize.define('practice_share',{

        user_id : {
            type: Sequelize.INTEGER
        },
        practice_id: {
            type: Sequelize.INTEGER
        }
    },
    {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  //   User.associate = models => {
  //     User.hasOne(models.teacherProfile, {
  //       foreignKey: 'user_id'
  //     });
  
  //     User.hasOne(models.routineFolder, {
  //       foreignKey: 'artist_id'
  //     });
  //     User.hasOne(models.user_challenges, {
  //       foreignKey: 'user_id'
  //     });
  
  //   }
  return Practice_Share;
}