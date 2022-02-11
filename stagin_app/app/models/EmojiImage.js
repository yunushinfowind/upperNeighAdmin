const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
    const EmojiImage = sequelize.define("emojiImage", {
      group_id: {
        type: Sequelize.INTEGER
      },
      image: {
        type: Sequelize.STRING
      },
      emoji_url: {
        type: Sequelize.VIRTUAL,
        get() {
          return (this.getDataValue('image')) ? config.HOST + 'uploads/emojiImages/' + this.getDataValue('image') : config.HOST + '/app/controllers/images/user_default.png';
        }
      },
  
    },
      {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
    return EmojiImage;
  };
  