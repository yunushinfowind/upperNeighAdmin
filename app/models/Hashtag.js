const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
    const Hashtag = sequelize.define("hashtag", {
        hashtag: {
            type: Sequelize.STRING,
        },
        image: {
            type: Sequelize.STRING,
            get () {
                return (this.getDataValue('image'))?config.HOST +'uploads/hashtag/'+ this.getDataValue('image'):config.HOST +'uploads/blog_default.png';
                }
        },
        video_thumb: {
            type: Sequelize.STRING,
            get () {
                return (this.getDataValue('video_thumb'))?config.HOST +'uploads/hashtag/thumbs/'+ this.getDataValue('video_thumb'):config.HOST +'uploads/blog_default.png';
                }
        },
        type: {
            type: Sequelize.ENUM('hashtag'),
        },
        status: {
            type: Sequelize.ENUM('active','inactive'),
        },
        deleted: {
            type: Sequelize.ENUM('1','0'),
        }

    },
        {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return Hashtag;
};
