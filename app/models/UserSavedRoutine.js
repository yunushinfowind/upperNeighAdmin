const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
    const UserSavedRoutine = sequelize.define("userSaveRoutine", {
        user_id: {
            type: Sequelize.INTEGER,
        },
        routine_id: {
            type: Sequelize.INTEGER,
        },
        video_id: {
            type: Sequelize.INTEGER,
        },
        type: {
            type: Sequelize.STRING,
        },
        routine_video_id: {
            type: Sequelize.STRING,
        }
        
    },
        {
            createdAt: 'created_at',
            updatedAt: 'updated_at',

        },
        {
            tableName: 'user_save_routines',
            freezeTableName: true,
            underscored: true,
        }
    );
    UserSavedRoutine.associate = models => {
        UserSavedRoutine.belongsTo(models.routine, {
            foreignKey: 'routine_id'
        });
        UserSavedRoutine.belongsTo(models.teacherVideo, {
            foreignKey: 'video_id'
        });
        UserSavedRoutine.belongsTo(models.routineVideo, {
            foreignKey: 'routine_video_id'
        });

    }

    return UserSavedRoutine;
};
