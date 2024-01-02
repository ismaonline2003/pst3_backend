module.exports = (sequelize, Sequelize, EmisionRadio, RadioSuscriptor, RadioEspectador) => {
    const functions = require('../routes/functions');
    const VisualizacionEmisionRadio = sequelize.define("visualizacion_emision_radio", {
        id_emision_radio: {
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
        tiempo_entrada: {
            type: Sequelize.DATE
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

    //hooks validations
    EmisionRadio.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(VisualizacionEmisionRadio, "id_emision_radio", record.id);
    });

    return VisualizacionEmisionRadio;
};
