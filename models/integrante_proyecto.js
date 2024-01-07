module.exports = (sequelize, Sequelize, Proyecto, Inscripcion) => {
    const functions = require('../routes/functions');
    const IntegranteProyecto = sequelize.define("integrante_proyecto", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        proyecto_id: {
            type: Sequelize.INTEGER,
            primaryKey: false,
            references: {
              model: Proyecto,
              key: 'id'
            }
        },
        inscripcion_id: {
            type: Sequelize.INTEGER,
            primaryKey: false,
            references: {
              model: Inscripcion,
              key: 'id'
            }
        },
    }, 
    {
      tableName: 'integrante_proyecto',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      timestamps: true
    });
    //Proyecto.belongsToMany(Inscripcion, { through: IntegranteProyecto, foreignKey: "proyecto_id", onDelete: 'cascade'});
    //Inscripcion.belongsToMany(Proyecto, { through: IntegranteProyecto,  foreignKey: "inscripcion_id"});
    Proyecto.hasMany(IntegranteProyecto,  {
      foreignKey: "proyecto_id",
        onDelete: 'RESTRICT'
    });
    IntegranteProyecto.belongsTo(Proyecto, {
      foreignKey: "proyecto_id",
      onDelete: 'RESTRICT'
    });
    Inscripcion.hasMany(IntegranteProyecto,  {
      foreignKey: "inscripcion_id",
        onDelete: 'RESTRICT'
    });
    IntegranteProyecto.belongsTo(Inscripcion, {
      foreignKey: "inscripcion_id",
      onDelete: 'RESTRICT'
    });
    //validations in hooks
    /*
    Proyecto.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(IntegranteProyecto, "proyecto_id", record.id);
    });
    */
    Inscripcion.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(IntegranteProyecto, "inscripcion_id", record.id);
    });
    return IntegranteProyecto;
};
