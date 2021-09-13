var appRoot = require('app-root-path');
const config = require("../config/config.js");
module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    email: {
      type: Sequelize.STRING,
      validate: {
        isEmail: true
      },
      unique: true
    },
    role_id: {
      type: Sequelize.INTEGER
    },
    type: {
      type: Sequelize.ENUM('normal', 'social')
    },
    fullname: {
      type: Sequelize.STRING
    },
    profile: {
      type: Sequelize.STRING,
      get() {
        if(this.getDataValue('type') == 'social' && this.getDataValue('profile').indexOf("https://") == 0){
          return (this.getDataValue('profile'))
        }else{
        return (this.getDataValue('profile')) ? config.HOST + 'uploads/profile/' + this.getDataValue('profile') : config.HOST + '/app/controllers/images/user_default.png';
        }
      }
    },
  
    password: {
      type: Sequelize.STRING
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive')
    },
    email_verify_status: {
      type: Sequelize.ENUM('active', 'inactive')
    },
    user_otp: {
      type: Sequelize.STRING
    },
    source_id: {
      type: Sequelize.STRING,
      get() {
        return (this.getDataValue('source_id')) ? this.getDataValue('source_id') : '';
      }
    },
    device_token: {
      type: Sequelize.TEXT,
      get() {
        return (this.getDataValue('device_token')) ? this.getDataValue('device_token') : '';
      }
    },
    login_token: {
      type: Sequelize.TEXT
    },
    routine_count: {
      type: Sequelize.VIRTUAL
    },
    video_count: {
      type: Sequelize.VIRTUAL
    },
    normal_video_count: {
      type: Sequelize.VIRTUAL
    },
    active_status: {
      type: Sequelize.VIRTUAL,
      get() {
        return (this.getDataValue('status')=='active') ? true : false;
      }
    }
  },
    {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    {
      tableName: 'users',
      freezeTableName: true,
      underscored: true,
      classMethods: {
        generateToken: () => {
          let chars, token;
          chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
            token = new Date().getTime() + '_';
          for (let x = 0; x < 16; x++) {
            let i = Math.floor(Math.random() * 62);
            token += chars.charAt(i);
          }
          return token;
        },
        generateTempToken: () => {
          let chars, temp = '';
          chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
          for (let x = 0; x < 16; x++) {
            let i = Math.floor(Math.random() * 62);
            temp += chars.charAt(i);
          }
          return temp;
        },
        generatePassword: () => {
          let chars, temp = '';
          chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
          for (let x = 0; x < 8; x++) {
            let i = Math.floor(Math.random() * 62);
            temp += chars.charAt(i);
          }
          return temp;
        },
        generateReferralCode: () => {

          let chars, temp = '';
          chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
          for (let x = 0; x < 6; x++) {
            let i = Math.floor(Math.random() * 62);
            temp += chars.charAt(i);
          }
          temp = temp.toUpperCase();
          return temp;

        }
      }
    }
  );
  User.associate = models => {
    User.hasOne(models.teacherProfile, {
      foreignKey: 'user_id'
    });

    User.hasOne(models.routineFolder, {
      foreignKey: 'artist_id'
    });
    User.hasOne(models.user_chalenges, {
      foreignKey: 'user_id'
    });

  }

  User['generateToken'] = () => {
    let chars, token;
    chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      token = new Date().getTime() + '_';
    for (let x = 0; x < 16; x++) {
      let i = Math.floor(Math.random() * 62);
      token += chars.charAt(i);
    }
    return token;
  };

  User['getToken'] = (req) => {
    let token;
    if (req.headers && (req.headers.token || req.headers["token"])) {
      token = req.headers.token ? req.headers.token : req.headers["token"];
    }

    if (req.body && req.body.token) {
      token = req.body.token;
    }

    if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (req.query && req.params.token) {
      token = req.params.token;
    }
    return token;
  }
  return User;
};


