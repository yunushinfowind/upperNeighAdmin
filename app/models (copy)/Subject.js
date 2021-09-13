module.exports = (sequelize, Sequelize) => {
    const Subject = sequelize.define("subjects", {
        student_id: {
            type: Sequelize.INTEGER,
        },
        name: {
            type: Sequelize.STRING,
        },
        sub: {
            type: Sequelize.STRING,
        },
        Dept: {
           type: Sequelize.STRING,
        }
    },
        {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    ) 
    
    // Student.associate = models => {
    //     Student.belongsTo(models.subject, {
    //         foreignKey: 'student_id'
    //     });
       
    // }   
  return Subject;
};