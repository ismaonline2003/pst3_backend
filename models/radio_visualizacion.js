module.exports = (sequelize, Sequelize) => {
    const functions = require('../routes/functions');
    const RadioVisualizacion = sequelize.define("radio_visualizacion", {
        ip: {
            type: Sequelize.STRING
        },
        live_emision_id: {
            type: Sequelize.INTEGER
        },
        audio_emision_id: {
            type: Sequelize.INTEGER
        },
        count: {
            type: Sequelize.INTEGER
        }
    }, 
    {
      tableName: 'radio_visualizacion',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    return RadioVisualizacion;
};
