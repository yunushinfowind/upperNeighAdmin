module.exports = (sequelize, Sequelize) => {
    const Student = sequelize.define("students", {
        email: {
            type: Sequelize.STRING,
        },
        name: {
            type: Sequelize.STRING,
        },
        gender: {
            type: Sequelize.ENUM('male', 'female')
        }
    },
        {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    ) 
    
    Student.associate = models => {
        Student.belongsTo(models.subject, {
            foreignKey: 'student_id'
        });
       
    }   
  return Student;
};