const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const db = {};
const dbConfig = require("../config/db.config.js");

const sequelize = new Sequelize(
    dbConfig.DB,
    dbConfig.USER,
    dbConfig.PASSWORD,
    {
        host: dbConfig.HOST,
        dialect: dbConfig.dialect,
        operatorAliases: false,
	    dialectOptions: {
			useUTC: true,
			dateStrings: true,
            typeCast: true,
	    },
	    //timezone: 'Asia/Kolkata',
        pool: {
                max: dbConfig.pool.max,
				min: dbConfig.pool.min,
				acquire: dbConfig.pool.acquire,
				idle: dbConfig.pool.idle
        },
	
	}
    
	
);

fs.readdirSync(__dirname).filter(file => {
    return (file.indexOf('.') !== 0) && (file !== 'index.js');
}).forEach(file => {
	
    let model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
});

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
    if (db[modelName].seedData) {
        db[modelName].seedData(config);
    }
});


db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;