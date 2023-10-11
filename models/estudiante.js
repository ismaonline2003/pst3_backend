module.exports = (sequelize, Sequelize, Person) => {
    const functions = require('../routes/functions');
    const Estudiante = sequelize.define("estudiante", {
      id_persona: {
        type: Sequelize.INTEGER
      },
      nro_expediente: {
        type: Sequelize.STRING
      },
      year_ingreso: {
        type: Sequelize.INTEGER
      }
    }, 
    {
      tableName: 'estudiante',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    Person.hasOne(Estudiante,  {
      foreignKey: "id_persona",
      onDelete: 'RESTRICT'
    });
    Estudiante.belongsTo(Person, {
      foreignKey: "id_persona",
      onDelete: 'RESTRICT'
    });
    Person.beforeDestroy(async (record, options) => {
      functions.onDeleteRestrictValidation(Estudiante, "id_persona", record.id);
    });
    return Estudiante;
};

