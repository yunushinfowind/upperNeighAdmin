const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const Practice = sequelize.define("practice", {
    user_id: {
      type: Sequelize.INTEGER
    },
    practice_name: {
      type: Sequelize.STRING
    },
    focus: {
      type: Sequelize.STRING
    },
    duration: {
      type: Sequelize.STRING
    },
    mood: {
        type: Sequelize.INTEGER
    },
    productivity: {
        type: Sequelize.STRING
    },
    like_practice_count: {
        type: Sequelize.VIRTUAL
      },
      comment_practice_count: {
        type: Sequelize.VIRTUAL
      },
      share_practice_count: {
        type: Sequelize.VIRTUAL
      },
      type: {
        type: Sequelize.VIRTUAL
      }
  },
    {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  Practice.associate = models => {
   Practice.hasMany(models.practice_likes, {
      foreignKey: 'practice_id'
    });

   Practice.hasMany(models.practice_comments, {
      foreignKey: 'practice_id'
    });
    Practice.hasMany(models.practice_share, {
      foreignKey: 'practice_id'
    });
    Practice.belongsTo(models.user, {
      foreignKey: 'user_id'
    });

  }
return Practice;
}