const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
    const userPlaylist = sequelize.define("userPlaylist", {
      user_id: {
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      }, 
      icon: {
        type: Sequelize.STRING,
      },
      icon_url: {
        type: Sequelize.VIRTUAL,
        get() {
          return (this.getDataValue('icon')) ? config.HOST + 'uploads/playlist_icon/' + this.getDataValue('icon') : config.HOST + 'uploads/ic_play_list.png';
        }
      },
      total_duration: {
        type: Sequelize.VIRTUAL
      },
      total_duration_inMint: {
        type: Sequelize.VIRTUAL
      },
      video_count: {
        type: Sequelize.VIRTUAL
      }
    },
      {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );

    userPlaylist.associate = models => {
        userPlaylist.hasOne(models.userSaveRoutine, {
          foreignKey: 'playlist_id'
        });
      }
    return userPlaylist;
  };
  