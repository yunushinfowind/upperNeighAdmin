const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
    const Blog = sequelize.define("setting", {
        key_value: {
            type: Sequelize.STRING,
        },
        value: {
            type: Sequelize.TEXT,
        },
        status: {
            type: Sequelize.ENUM('active','inactive'),
        }

    },
        {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return Blog;
};
