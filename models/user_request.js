module.exports = (sequelize, Sequelize, User) => {
    const UserRequest = sequelize.define("user_request", {
      user_id: {
        type: Sequelize.INTEGER
      },
      request_hash: {
        type: Sequelize.STRING
      },
      r_type: {
        type: Sequelize.ENUM,
        values: ["password_reset"]
      },
      request_done: {
        type: Sequelize.BOOLEAN,
        defaultValue: 0
      },
      request_done_date: {
        type: Sequelize.DATE
      }
    }, 
    {
      tableName: 'user_request',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true,
    });

    User.hasOne(UserRequest, {
        foreignKey: "user_id",
        onDelete: 'RESTRICT'
      });
  
    UserRequest.belongsTo(User, {
      foreignKey: "user_id",
      onDelete: 'RESTRICT'
    });
    
    return UserRequest;
};