module.exports = (sequelize, Sequelize, Seccion) => {
    const Proyecto = sequelize.define("proyecto", {
      id_seccion: {
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING
      },
      descripcion: {
        type: Sequelize.STRING
      },
      tipo:  {
        type: Sequelize.ENUM,
        values: ["IMG", "DOC"]
      },
      miniatura: {
        type: Sequelize.BLOB
      }
    }, 
    {
      tableName: 'proyecto',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    Seccion.hasMany(Proyecto,  {
        foreignKey: "id_seccion",
        onDelete: 'RESTRICT'
    });
    Proyecto.belongsTo(Seccion, {
      foreignKey: "id_seccion",
      onDelete: 'RESTRICT'
    });
    Seccion.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(Proyecto, "id_seccion", record.id);
    });
    return Proyecto;
};

