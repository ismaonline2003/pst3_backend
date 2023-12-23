module.exports = (sequelize, Sequelize, EmisionRadio, RadioSuscriptor, RadioEspectador) => {
    const functions = require('../routes/functions');
    const RadioEspectadorMensaje = sequelize.define("radio_espectador_mensaje", {
        id_emision_radio: {
            type: Sequelize.INTEGER
        },
        id_radio_suscriptor: {
            type: Sequelize.INTEGER
        },
        id_radio_espectador: {
            type: Sequelize.INTEGER
        },
        mensaje: {
            type: Sequelize.STRING
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

    RadioSuscriptor.hasMany(RadioEspectadorMensaje,  {
        foreignKey: "id_radio_suscriptor",
        onDelete: 'RESTRICT'
    });
    RadioEspectadorMensaje.belongsTo(RadioSuscriptor, {
      foreignKey: "id_radio_suscriptor",
      onDelete: 'RESTRICT'
    });

    RadioEspectador.hasMany(RadioEspectadorMensaje,  {
        foreignKey: "id_radio_espectador",
        onDelete: 'RESTRICT'
    });
    RadioEspectadorMensaje.belongsTo(RadioEspectador, {
      foreignKey: "id_radio_espectador",
      onDelete: 'RESTRICT'
    });


    //hooks validations
    EmisionRadio.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(RadioEspectadorMensaje, "id_emision_radio", record.id);
    });

    RadioSuscriptor.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(RadioEspectadorMensaje, "id_radio_suscriptor", record.id);
    });

    RadioEspectador.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(RadioEspectadorMensaje, "id_radio_espectador", record.id);
    });

    return RadioEspectadorMensaje;
};
