module.exports = (sequelize, Sequelize) => {
    const VideoSlice = sequelize.define("videoSlice", {
        video_id: {
            type: Sequelize.INTEGER
        },
        type: {
            type: Sequelize.STRING
        },
        routine_id: {
            type: Sequelize.INTEGER
        },
        artist_id: {
            type: Sequelize.INTEGER
        },
        series_id : {
            type: Sequelize.INTEGER
        },
        artist_video_id: {
            type: Sequelize.INTEGER
        },
        
        slice_info: {
            type: Sequelize.TEXT,
            get() {
                return (JSON.parse(this.getDataValue('slice_info'))) ;
            }
        },
        recording_info: {
            type: Sequelize.TEXT,
            get() {
                return (JSON.parse(this.getDataValue('recording_info'))) ;
            }
        }
    },
        {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
        {
            freezeTableName: true
          }
    );
    return VideoSlice;
};
