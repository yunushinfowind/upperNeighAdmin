const config = require('../config/config.js');
module.exports = (sequelize,Sequelize) => {
    const Quiz_Questions = sequelize.define('quiz_questions',{ 
      question : {
        type : Sequelize.TEXT
        },
        status : {
            type: Sequelize.ENUM('active', 'inactive')
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