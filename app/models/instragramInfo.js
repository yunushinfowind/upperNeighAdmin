const db = require(".");
const config = require("../config/config.js");
const User = db.users;
module.exports = (sequelize, Sequelize) => {
    const instagramInfo = sequelize.define("instagramInfo", {
        hashtag: {
            type: Sequelize.STRING,
        },
        responseInfo: {
            type: Sequelize.TEXT,
            get() {
                return (JSON.parse(this.getDataValue('responseInfo'))) ;
            }
        }
    },

        {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },

    );
    return instagramInfo;
};
