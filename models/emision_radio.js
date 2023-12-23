module.exports = (sequelize, Sequelize, User) => {
    const functions = require('../routes/functions');
    const EmisionRadio = sequelize.define("emision_radio", {
        id_emisor: {
            type: Sequelize.INTEGER
        },
        titulo: {
            type: Sequelize.STRING
        },
        descripcion: {
            type: Sequelize.STRING
        },
        status_actual: {
            type: Sequelize.ENUM,
            values: ["en_emision", "pausada", "finalizada", "programada"]
        },
        duracion: {
            type: Sequelize.FLOAT
        },
        fecha_inicio: {
            type: Sequelize.DATE
        },
        fecha_fin: {
            type: Sequelize.DATE
        },
        file: {
            type: Sequelize.STRING
        }
    }, 
    {
      tableName: 'emision_radio',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    User.hasMany(EmisionRadio,  {
        foreignKey: "id_emisor",
        onDelete: 'RESTRICT'
    });
    EmisionRadio.belongsTo(User, {
      foreignKey: "id_emisor",
      onDelete: 'RESTRICT'
    });
    //validations in hooks
    User.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(EmisionRadio, "id_emisor", record.id);
    });
    return EmisionRadio;
};
