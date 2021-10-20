const config = require('../config/config.js');
module.exports = (sequelize,Sequelize) => {
    const Quiz_Question_Options = sequelize.define('quiz_question_options',{ 
      question_id : {
        type : Sequelize.INTEGER
        },
        option_name : {
            type: Sequelize.STRING
        }
        
    },
    {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    // User_Challenge.associate = models => {
    //     User_Challenge.hasMany(models.challenge_likes, {
    //        foreignKey: 'challenge_id'
    //      });
    //
    // }
    return Quiz_Question_Options;
}