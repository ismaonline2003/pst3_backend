module.exports = (sequelize, Sequelize, EmisionRadio, Usuario) => {
    const functions = require('../routes/functions');
    const RadioEspectadorMensaje = sequelize.define("radio_espectador_mensaje", {
        id_emision_radio: {
            type: Sequelize.INTEGER
        },
        user_id: {
            type: Sequelize.INTEGER
        },
        username: {
            type: Sequelize.STRING
        },
        content: {
            type: Sequelize.STRING
        },
        fecha_envio: {
            type: Sequelize.DATE
        }
    }, 
    {
      tableName: 'radio_espectador_mensaje',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });

    //setting relations
    EmisionRadio.hasMany(RadioEspectadorMensaje,  {
        foreignKey: "id_emision_radio",
        onDelete: 'RESTRICT'
    });
    RadioEspectadorMensaje.belongsTo(EmisionRadio, {
      foreignKey: "id_emision_radio",
      onDelete: 'RESTRICT'
    });

    Usuario.hasMany(RadioEspectadorMensaje,  {
        foreignKey: "user_id",
        onDelete: 'RESTRICT'
    });
    RadioEspectadorMensaje.belongsTo(Usuario, {
      foreignKey: "user_id",
      onDelete: 'RESTRICT'
    });


    //hooks validations
    EmisionRadio.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(RadioEspectadorMensaje, "id_emision_radio", record.id);
    });

    Usuario.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(RadioEspectadorMensaje, "user_id", record.id);
    });

    return RadioEspectadorMensaje;
};
