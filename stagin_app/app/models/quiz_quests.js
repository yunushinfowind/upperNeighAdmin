const config = require('../config/config.js');
module.exports = (sequelize,Sequelize) => {
    const Quiz_Questions = sequelize.define('quiz_quests',{ 
      question : {
        type : Sequelize.TEXT
        },
        status : {
            type: Sequelize.ENUM('active', 'inactive')
        },
        
        choice_type: {
            type: Sequelize.ENUM('single','multiple')
           
        }
        
        
    },
    {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    Quiz_Questions.associate = models => {
        Quiz_Questions.hasMany(models.quiz_question_options, {
           foreignKey : 'question_id'
         });
    
    }
    return Quiz_Questions;
}