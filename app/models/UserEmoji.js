module.exports = (sequelize, Sequelize) => {
  const UserEmoji = sequelize.define("userEmoji", {
    user_id: {
      type: Sequelize.INTEGER
    },
    emoji: {
      type: Sequelize.STRING
    }

  },
    {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );


  return UserEmoji;
};
