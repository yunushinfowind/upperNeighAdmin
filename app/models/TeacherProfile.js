const db = require(".");
const config = require("../config/config.js");
const User = db.users;
module.exports = (sequelize, Sequelize) => {
  const TeacherProfile = sequelize.define("teacherProfile", {
    user_id: {
      type: Sequelize.INTEGER
    },
    list_order:{
      type: Sequelize.INTEGER,
  },
    profession: {
      type: Sequelize.STRING,

    },
    history: {
      type: Sequelize.TEXT,

    },
    career_highlight: {
      type: Sequelize.TEXT
    },
    key_point: {
      type: Sequelize.STRING
    },
    performance: {
      type: Sequelize.STRING
    },
    address: {
      type: Sequelize.STRING
    },
    emojis: {
      type: Sequelize.VIRTUAL
    }
  },

    {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },

  );
  TeacherProfile.associate = models => {
    TeacherProfile.hasMany(models.userEmoji, {
      foreignKey: 'teacher_profile_id'
    });

  }
  return TeacherProfile;
};
