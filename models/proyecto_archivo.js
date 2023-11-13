module.exports = (sequelize, Sequelize, Proyecto) => {
    const proyectoArchivo = sequelize.define("proyecto_archivo", {
      id_proyecto: {
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING
      },
      descripcion: {
        type: Sequelize.STRING
      },
      file: {
        type: Sequelize.BLOB
      },
      url: {
        type: Sequelize.STRING
      },
      posicion: {
        type: Sequelize.INTEGER
      },
      tipo:  {
        type: Sequelize.ENUM,
        values: ["IMG", "DOC"]
      }
    }, 
    {
      tableName: 'proyecto_archivo',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    Proyecto.hasMany(proyectoArchivo,  {
        foreignKey: "id_proyecto",
        onDelete: 'RESTRICT'
    });
    proyectoArchivo.belongsTo(Proyecto, {
      foreignKey: "id_proyecto",
      onDelete: 'RESTRICT'
    });
    //hooks validations
    Proyecto.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(proyectoArchivo, "id_proyecto", record.id);
    });
    return proyectoArchivo;
};