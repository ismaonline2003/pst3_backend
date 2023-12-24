module.exports = (sequelize, Sequelize, Usuario) => {
    const LogsSistema = sequelize.define("logs_sistema", {
      user_id: {
        type: Sequelize.INTEGER
      },
      tipo: {
        type: Sequelize.ENUM,
        values: ["inicio_sesion", "create", 'update', 'delete']
      },
      body: {
        type: Sequelize.TEXT
      },
      fecha: {
        type: Sequelize.DATE
      }
    }, 
    {
      tableName: 'logs_sistema',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true,
    });
    Usuario.hasMany(LogsSistema,  {
      foreignKey: "user_id",
      onDelete: 'RESTRICT'
    });
    LogsSistema.belongsTo(Usuario,  {
      foreignKey: "user_id",
      onDelete: 'RESTRICT'
    });
    return LogsSistema;
};