module.exports = (sequelize, Sequelize, Person) => {
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
    /*
    Person.beforeDestroy((record, options) => {
      console.log('person beforeDestroy', record.name)
      throw ('You cannot delete a person');
    });
    */
    return Estudiante;
};

