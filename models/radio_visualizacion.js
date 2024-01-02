module.exports = (sequelize, Sequelize) => {
    const functions = require('../routes/functions');
    const RadioVisualizacion = sequelize.define("radio_visualizacion", {
        activo: {
            type: Sequelize.BOOLEAN
        },
        ip: {
            type: Sequelize.STRING
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
