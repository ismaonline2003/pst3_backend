module.exports = (sequelize, Sequelize, Usuario) => {
    const RadioSuscriptor = sequelize.define("radio_suscriptor", {
        user_id: {
            type: Sequelize.INTEGER
        },
        fecha_suscripcion: {
            type: Sequelize.DATE
        },
        username: {
            type: Sequelize.STRING
        }
    }, 
    {
      tableName: 'radio_suscriptor',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    Usuario.hasMany(RadioSuscriptor,  {
        foreignKey: "user_id",
        onDelete: 'RESTRICT'
    });
    RadioSuscriptor.belongsTo(Usuario, {
      foreignKey: "user_id",
      onDelete: 'RESTRICT'
    });

    //validations in hooks
    Usuario.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(RadioSuscriptor, "user_id", record.id);
    });
    
    return RadioSuscriptor;
};
