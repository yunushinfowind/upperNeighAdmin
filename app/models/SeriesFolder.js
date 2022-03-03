const db = require(".");
const config = require("../config/config.js");
const User = db.users;
module.exports = (sequelize, Sequelize) => {
    const SeriesFolder = sequelize.define("seriesFolders", {
        series_id: {
            type: Sequelize.INTEGER
        },
        artist_id: {
            type: Sequelize.INTEGER
        },
        folder_info: {
            type: Sequelize.TEXT,
            get() {
                return (JSON.parse(this.getDataValue('folder_info'))) ;
            }
        },
        type: {
            type: Sequelize.STRING,
        }
    },
    {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    );
    return SeriesFolder;
};
