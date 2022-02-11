module.exports = {
  HOST: "localhost",
  USER: "root",
  PASSWORD: "Admin@123",
  // DB: "upperneighbour_live",
  DB: "upperneighbour_live_latest",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
