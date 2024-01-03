module.exports = (sequelize, Sequelize, AudioModel) => {
    const functions = require('../routes/functions');
    const EmisionAudio = sequelize.define("emision_audio", {
        id_audio: {
            type: Sequelize.INTEGER
        },
        fecha_emision_programada: {
            type: Sequelize.DATE
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
