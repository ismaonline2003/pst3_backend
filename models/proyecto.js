module.exports = (sequelize, Sequelize, Seccion, Profesor) => {
    const functions = require('../routes/functions');
    const Proyecto = sequelize.define("proyecto", {
      id_seccion: {
        type: Sequelize.INTEGER
      },
      id_profesor: {
        type: Sequelize.INTEGER,
      },
      nombre: {
        type: Sequelize.STRING
      },
      descripcion: {
        type: Sequelize.TEXT
      },
      tipo:  {
        type: Sequelize.ENUM,
        values: ["IMG", "DOC"]
      },
      miniatura_filename: {
        type: Sequelize.STRING
      },
      wordpress_id: {
        type: Sequelize.INTEGER
      },
      miniatura_wordpress_id: {
        type: Sequelize.INTEGER
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
    Profesor.hasMany(Proyecto,  {
      foreignKey: "id_profesor",
      onDelete: 'RESTRICT'
    });
    Proyecto.belongsTo(Profesor, {
      foreignKey: "id_profesor",
      onDelete: 'RESTRICT'
    });
    Seccion.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(Proyecto, "id_seccion", record.id);
    });
    Profesor.beforeDestroy(async (record, options) => {
      functions.onDeleteRestrictValidation(Proyecto, "id_profesor", record.id);
    });
    return Proyecto;
};

