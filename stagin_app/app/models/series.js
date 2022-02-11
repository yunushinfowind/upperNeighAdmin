const config = require("../config/config.js");
module.exports = (sequelize,Sequelize) => {
    const Series = sequelize.define("series",{
        name: {
          type:  Sequelize.STRING
        },
        description: {
            type: Sequelize.STRING
        },
        image: {
            type: Sequelize.STRING,
            get() {
              return (this.getDataValue('image')) ? config.HOST + 'uploads/series/images/' + this.getDataValue('image') : config.HOST + '/app/controllers/images/user_default.png';
            }
        }
    },
    {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });
      Series.associate = models => {
        Series.hasOne(models.series_videos, {
          foreignKey: 'series_id'
        });
    //     Series.belongsTo(models.user, {
    //       foreignKey: 'user_id'
    //     });
    //     Series.hasMany(models.routineVideo, {
    //       foreignKey: 'routine_id'
    //     });
      }
    
      return Series;
};




