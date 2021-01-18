const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
    const Role = sequelize.define("role", {
        role_name: {
            type: Sequelize.STRING,
        }
    },
        {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return Role;
};
