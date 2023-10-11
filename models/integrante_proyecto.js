module.exports = (sequelize, Sequelize, Proyecto, Inscripcion) => {
    const IntegranteProyecto = sequelize.define("integrante_proyecto", {
        proyecto_id: {
            type: Sequelize.INTEGER,
            references: {
              model: Proyecto,
              key: 'id'
            }
        },
        inscripcion_id: {
            type: Sequelize.INTEGER,
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
      paranoid: true,
      timestamps: true
    });
    Proyecto.belongsToMany(Inscripcion, { through: IntegranteProyecto, foreignKey: "proyecto_id"});
    Inscripcion.belongsToMany(Proyecto, { through: IntegranteProyecto,  foreignKey: "inscripcion_id"});
    //validations in hooks
    Proyecto.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(IntegranteProyecto, "proyecto_id", record.id);
    });
    Inscripcion.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(IntegranteProyecto, "inscripcion_id", record.id);
    });
    return IntegranteProyecto;
};
