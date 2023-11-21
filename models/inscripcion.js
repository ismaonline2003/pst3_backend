module.exports = (sequelize, Sequelize, Estudiante, Seccion) => {
    const functions = require('../routes/functions');
    const Inscripcion = sequelize.define("inscripcion", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        estudiante_id: {
            type: Sequelize.INTEGER,
            primaryKey: false,
            references: {
              model: Estudiante,
              key: 'id'
            }
        },
        seccion_id: {
            type: Sequelize.INTEGER,
            primaryKey: false,
            references: {
              model: Seccion,
              key: 'id'
            }
        },
    }, 
    {
      tableName: 'inscripcion',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    Estudiante.belongsToMany(Seccion, { through: Inscripcion, foreignKey: "estudiante_id"});
    Seccion.belongsToMany(Estudiante, { through: Inscripcion,  foreignKey: "seccion_id"});
    //validations in hooks
    Estudiante.beforeDestroy(async (record, options) => {
      functions.onDeleteRestrictValidation(Inscripcion, "estudiante_id", record.id);
    });
    Seccion.beforeDestroy(async (record, options) => {
      functions.onDeleteRestrictValidation(Inscripcion, "seccion_id", record.id);
    });
    return Inscripcion;
};

