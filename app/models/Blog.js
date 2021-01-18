const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
    const Blog = sequelize.define("blog", {
        title: {
            type: Sequelize.STRING,
        },
        list_order:{
            type: Sequelize.INTEGER,
        },
        description: {
            type: Sequelize.TEXT,
            //  get () {
            //     return this.getDataValue('description').replace(/<\/?[^>]+(>|$)/g, "");
            //     }
        },
        // blog_des: {
        //     type: Sequelize.VIRTUAL,
        //      get () {
        //         return this.getDataValue('description').replace(/<\/?[^>]+(>|$)/g, "");
        //         }
        //   },
        image: {
            type: Sequelize.STRING,
            get () {
                return (this.getDataValue('image'))?config.HOST +'uploads/blogs/'+ this.getDataValue('image'):config.HOST +'uploads/blog_default.png';
                }
        },
        url: {
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
