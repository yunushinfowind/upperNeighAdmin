const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const Routine = sequelize.define("routine", {
    user_id: {
      type: Sequelize.INTEGER,
    },
    routine_name: {
      type: Sequelize.STRING,
    },
    image: {
      type: Sequelize.STRING,
      get() {
        return (this.getDataValue('image')) ? config.HOST + 'uploads/routines/images/' + this.getDataValue('image') : config.HOST + '/app/controllers/images/user_default.png';
      }
    },
    routine_description: {
      type: Sequelize.STRING,
    },  
    routine_level: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive'),
    },
    total_duration: {
      type: Sequelize.VIRTUAL
    },
    total_duration_inMint: {
      type: Sequelize.VIRTUAL
    },
    is_saved: {
      type: Sequelize.VIRTUAL
    },
    video_count: {
      type: Sequelize.VIRTUAL
    },
    content_type: {
      type: Sequelize.STRING
    }
  },
    {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  Routine.associate = models => {
    Routine.hasOne(models.routineFolder, {
      foreignKey: 'routine_id'
    });
    Routine.belongsTo(models.user, {
      foreignKey: 'user_id'
    });
    Routine.hasMany(models.routineVideo, {
      foreignKey: 'routine_id'
    });
  }


  return Routine;
};
