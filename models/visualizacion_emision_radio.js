module.exports = (sequelize, Sequelize, EmisionRadio, RadioSuscriptor, RadioEspectador) => {
    const functions = require('../routes/functions');
    const VisualizacionEmisionRadio = sequelize.define("visualizacion_emision_radio", {
        id_emision_radio: {
            type: Sequelize.INTEGER
        },
        id_radio_suscriptor: {
            type: Sequelize.INTEGER
        },
        id_radio_espectador: {
            type: Sequelize.INTEGER
        },
        ipv4: {
            type: Sequelize.STRING
        },
        navegador: {
            type: Sequelize.STRING
        },
        dispositivo: {
            type: Sequelize.STRING
        },
        ultimo_tiempo_entrada: {
            type: Sequelize.DATE
        },
        ultimo_tiempo_salida: {
            type: Sequelize.DATE
        },
        tiempo_duracion: {
            type: Sequelize.INTEGER
        }
    }, 
    {
      tableName: 'visualizacion_emision_radio',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });

    //setting relations
    EmisionRadio.hasMany(VisualizacionEmisionRadio,  {
        foreignKey: "id_emision_radio",
        onDelete: 'RESTRICT'
    });
    VisualizacionEmisionRadio.belongsTo(EmisionRadio, {
      foreignKey: "id_emision_radio",
      onDelete: 'RESTRICT'
    });

    RadioSuscriptor.hasMany(VisualizacionEmisionRadio,  {
        foreignKey: "id_radio_suscriptor",
        onDelete: 'RESTRICT'
    });
    VisualizacionEmisionRadio.belongsTo(RadioSuscriptor, {
      foreignKey: "id_radio_suscriptor",
      onDelete: 'RESTRICT'
    });

    RadioEspectador.hasMany(VisualizacionEmisionRadio,  {
        foreignKey: "id_radio_espectador",
        onDelete: 'RESTRICT'
    });
    VisualizacionEmisionRadio.belongsTo(RadioEspectador, {
      foreignKey: "id_radio_espectador",
      onDelete: 'RESTRICT'
    });


    //hooks validations
    EmisionRadio.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(VisualizacionEmisionRadio, "id_emision_radio", record.id);
    });

    RadioSuscriptor.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(VisualizacionEmisionRadio, "id_radio_suscriptor", record.id);
    });

    RadioEspectador.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(VisualizacionEmisionRadio, "id_radio_espectador", record.id);
    });

    return VisualizacionEmisionRadio;
};
