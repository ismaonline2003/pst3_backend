module.exports = (sequelize, Sequelize, AudioModel) => {
    const functions = require('../routes/functions');
    const EmisionAudio = sequelize.define("emision_audio", {
        id_audio: {
            type: Sequelize.INTEGER
        },
        fecha_emision_programada: {
            type: Sequelize.DATE
        },
        fecha_fin_emision_programada: {
            type: Sequelize.DATE
        },
        audio_volume: {
            type: Sequelize.FLOAT,
            defaultValue: 1
        },
        taken: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        finished: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    }, 
    {
      tableName: 'emision_audio',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    AudioModel.hasMany(EmisionAudio,  {
        foreignKey: "id_audio",
        onDelete: 'RESTRICT'
    });
    EmisionAudio.belongsTo(AudioModel, {
      foreignKey: "id_audio",
      onDelete: 'RESTRICT'
    });
    //validations in hooks
    AudioModel.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(EmisionAudio, "id_audio", record.id);
    });
    return EmisionAudio;
};
