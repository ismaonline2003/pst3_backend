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
    Person.beforeDestroy(async (record, options) => {
      let searchPersona = await Estudiante.findAll({where: {id_persona: record.id}})
      if(searchPersona.length > 0) {
        console.log('No se puede eliminar a este estudiante')
        throw ('No se puede eliminar a este estudiante');
      }
    });
    return Estudiante;
};

