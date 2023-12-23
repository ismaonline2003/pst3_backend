module.exports = (sequelize, Sequelize, Usuario) => {
    const functions = require('../routes/functions');
    const Suscripcion = sequelize.define("suscripcion", {
        user_id: {
            type: Sequelize.INTEGER
        },
        fecha_suscripcion: {
            type: Sequelize.DATE
        },
        username: {
            type: Sequelize.STRING
        },
        email: {
            type: Sequelize.STRING
        },
        tipo: {
            type: Sequelize.ENUM,
            values: ["radio", "portal_noticias"]
        },
        activa: {
            type: Sequelize.BOOLEAN
        }
    }, 
    {
      tableName: 'suscripcion',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    Usuario.hasMany(Suscripcion,  {
        foreignKey: "user_id",
        onDelete: 'RESTRICT'
    });
    Suscripcion.belongsTo(Usuario, {
      foreignKey: "user_id",
      onDelete: 'RESTRICT'
    });

    //validations in hooks
    Usuario.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(Suscripcion, "user_id", record.id);
    });
    
    return Suscripcion;
};
